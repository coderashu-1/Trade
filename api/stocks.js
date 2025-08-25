const express = require("express");
const router = express.Router();
const authorize = require("../middleware/authorize");
const moment = require("moment");
const Stock = require("../models/stock");
const User = require("../models/user");

// ✅ Fetch user's trade history
router.post("/find", async (req, res) => {
  try {
    const trades = await Stock.find({ user: req.body.id }).sort({ date: -1 });
    res.json(trades);
  } catch (err) {
    console.error("Error fetching trades:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Buy (place bet / purchase)
router.post("/buy", authorize, async (req, res) => {
  const userId = req.user.id;
  const { quantity, price, ticker, data, value } = req.body;

  if (!quantity || !price || !ticker || !value) {
    return res.status(400).json({ msg: "Please enter all required fields" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const betCost = Number(value);
    let currentBalance = Number(user.balance);

    if (betCost > currentBalance) {
      return res.status(400).json({ msg: "Insufficient funds" });
    }

    // ⛔ Step 1: Deduct balance for placing the bet
    currentBalance -= betCost;

    // ✅ Step 2: If won, credit winnings (2x payout)
    let outcomeLog = `Placed bet on ${ticker} at $${price} for $${betCost} on ${moment().format("L")}.`;

    if (data && data.outcome === "won") {
      const payout = betCost * 2;
      currentBalance += payout;

      outcomeLog += ` ✅ WON: Credited $${payout}.`;
    } else if (data && data.outcome === "lost") {
      outcomeLog += ` ❌ LOST: Bet amount lost.`;
    } else if (data && data.outcome === "stopped") {
      outcomeLog += ` ⚠️ STOPPED (Loss): Bet stopped via stop loss.`;
    }

    // ✅ Step 3: Update user balance and history
    user.balance = currentBalance;
    user.history.push(outcomeLog);
    await user.save();

    // ✅ Step 4: Save stock/bet details
    const stock = new Stock({
      stock: req.body.stock || "",
      ticker,
      price,
      quantity,
      data,
      value,
      user: userId
    });

    const saved = await stock.save();

    // ✅ Step 5: Return updated balance and bet
    res.json({
      stock: saved,
      newBalance: user.balance
    });
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ msg: "Failed to process transaction" });
  }
});

// ✅ Sell or delete stock
router.post("/delete", authorize, async (req, res) => {
  try {
    const user = await User.findById(req.body.user.id);
    const sellValue = Number(req.body.price) * Number(req.body.quantity);

    user.balance += sellValue;
    user.history.push(
      `Sold ${req.body.quantity} shares of ${req.body.ticker} at $${req.body.price} on ${moment().format("L")} for $${sellValue}.`
    );
    await user.save();

    const stock = await Stock.findById(req.body.id);
    if (!stock) return res.status(404).json({ msg: "Stock not found" });

    await stock.remove();
    res.json({ success: true, deletedId: stock._id });
  } catch (err) {
    console.error("Delete stock error:", err);
    res.status(500).json({ success: false, msg: "Failed to delete" });
  }
});

module.exports = router;

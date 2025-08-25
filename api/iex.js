require("dotenv").config();
const axios = require("axios");
const express = require("express");
const router = express.Router();
// const authorize = require("../middleware/authorize"); // Uncomment if you need private access
const Stock = require("../models/stock"); // Optional: your MongoDB model for storing bets

// @route   GET /api/stock?symbol=AAPL
// @desc    Fetch current stock price from Alpha Vantage
router.get("/", async (req, res) => {
  const symbol = req.query.symbol || "AAPL"; // Default to AAPL if not provided
  const apiKey = process.env.alphaVantageKey;

  try {
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: symbol,
        apikey: apiKey,
      },
    });

    const quote = response.data["Global Quote"];

    if (!quote || Object.keys(quote).length === 0) {
      return res.status(404).json({ error: "No data found for symbol" });
    }

    res.json({
      symbol: quote["01. symbol"],
      price: quote["05. price"],
      change: quote["09. change"],
      percentChange: quote["10. change percent"],
    });
  } catch (error) {
    console.error("Alpha Vantage error:", error.message);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// @route   POST /api/stock
// @desc    Placeholder to store stock bet (customize as needed)
router.post("/", async (req, res) => {
  const { symbol, price, userId, betAmount, direction } = req.body;

  try {
    const newStock = new Stock({
      symbol,
      price,
      userId,
      betAmount,
      direction,
      placedAt: new Date(),
    });

    const saved = await newStock.save();
    res.json({ message: "Bet placed", data: saved });
  } catch (err) {
    console.error("DB Save Error:", err.message);
    res.status(500).json({ error: "Failed to save bet" });
  }
});

module.exports = router;

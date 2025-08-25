import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";

const MarketOverview = () => {
  const [data, setData] = useState({
    sp500: null,
    nasdaq: null,
    btc: null,
    // gold: null,
  });
  const [loading, setLoading] = useState(true);

  const apiKey = "d1sffn9r01qqlgb2vfv0d1sffn9r01qqlgb2vfvg"; // Directly use the key

  useEffect(() => {
    const fetchQuote = async (symbol) => {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
      return res.json();
    };

    const fetchData = async () => {
      try {
        const [sp500, nasdaq, btc, gold] = await Promise.all([
          fetchQuote("SPY"),         // S&P 500 ETF
          fetchQuote("QQQ"),         // NASDAQ ETF
          fetchQuote("BINANCE:BTCUSDT"), // BTC/USD
          // fetchQuote("OANDA:XAUUSD"),   // Gold
        ]);
        setData({ sp500, nasdaq, btc, gold });
      } catch (err) {
        console.error("Finnhub fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const safePrice = (val) => (val ? `$${Number(val).toFixed(2)}` : "N/A");
  const safeChange = (d, pc) => d ? `(${d > 0 ? '+' : ''}${pc.toFixed(2)}%)` : "";

  if (loading) {
    return (
      <Card className="p-3 bg-dark text-white shadow-sm text-center">
        <Spinner animation="border" variant="light" />
        <div>Loading Market Overview...</div>
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-dark text-white shadow-sm">
      <Row>
        <Col>
          📈 S&P 500 (SPY): {safePrice(data.sp500?.c)}{" "}
          {safeChange(data.sp500?.d, data.sp500?.dp)}
        </Col>
        <Col>
          📉 NASDAQ (QQQ): {safePrice(data.nasdaq?.c)}{" "}
          {safeChange(data.nasdaq?.d, data.nasdaq?.dp)}
        </Col>
        <Col>
          🪙 BTC/USD: {safePrice(data.btc?.c)}{" "}
          {safeChange(data.btc?.d, data.btc?.dp)}
        </Col>
        {/* <Col>
          💹 Gold: {safePrice(data.gold?.c)}{" "}
          {safeChange(data.gold?.d, data.gold?.dp)}
        </Col> */}
      </Row>
    </Card>
  );
};

export default MarketOverview;

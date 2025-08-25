import React, { useEffect, useState } from "react";
import { Card, Spinner, Button } from "react-bootstrap";
import axios from "axios";

const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NFLX", "NVDA"];
const API_KEY = "d1sffn9r01qqlgb2vfv0d1sffn9r01qqlgb2vfvg";

const LiveQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        STOCK_SYMBOLS.map(async (symbol) => {
          try {
            const res = await axios.get(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
            );
            const data = res.data || {};
            return {
              symbol,
              current: data.c ?? null,
              open: data.o ?? null,
              high: data.h ?? null,
              low: data.l ?? null,
              previousClose: data.pc ?? null,
              change: data.c != null && data.pc != null ? data.c - data.pc : null,
            };
          } catch (err) {
            console.error(`Error fetching ${symbol}:`, err);
            return { symbol, current: null, open: null, high: null, low: null, previousClose: null, change: null };
          }
        })
      );
      setQuotes(results);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching quotes:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const renderChange = (change, previousClose) => {
    if (change == null || previousClose == null) return "N/A";
    const isPositive = change >= 0;
    const sign = isPositive ? "+" : "";
    const percent = ((change / previousClose) * 100).toFixed(2);
    return `${sign}${change.toFixed(2)} (${percent}%)`;
  };

  return (
    <div className="text-center my-4" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <h2
        style={{
          fontWeight: "700",
          letterSpacing: "1.2px",
          marginBottom: "1.5rem",
          background: "linear-gradient(90deg, #007bff, #00c6ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 6px rgba(0,123,255,0.4)",
        }}
      >
        Live Stock Quotes
      </h2>

      <Button
        variant="outline-primary"
        size="sm"
        onClick={fetchQuotes}
        disabled={loading}
        className="mb-4"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </Button>

      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : (
        <div className="d-flex flex-wrap justify-content-center gap-3">
          {quotes.map((q) => {
            if (!q || typeof q !== "object") return null;
            const { symbol, current, change, previousClose, open, high, low } = q;
            const isPositive = change != null && change >= 0;

            return (
              <Card
                key={symbol}
                style={{
                  width: "140px",
                  minHeight: "180px",
                  borderRadius: "10px",
                  padding: "0.75rem",
                  margin: "6px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                  border: "1px solid #f1f1f1",
                  transition: "transform 0.2s ease-in-out",
                }}
                className="text-center"
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Card.Title style={{ fontWeight: "600", fontSize: "1rem" }}>{symbol}</Card.Title>
                <Card.Subtitle
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: isPositive ? "#28a745" : "#dc3545",
                  }}
                >
                  {current != null ? `$${current.toFixed(2)}` : "N/A"}
                </Card.Subtitle>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: isPositive ? "#28a745" : "#dc3545",
                    marginBottom: "0.5rem",
                  }}
                >
                  {renderChange(change, previousClose)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#555" }}>
                  <div>O: {open != null ? `$${open.toFixed(2)}` : "N/A"}</div>
                  <div>H: {high != null ? `$${high.toFixed(2)}` : "N/A"}</div>
                  <div>L: {low != null ? `$${low.toFixed(2)}` : "N/A"}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {lastUpdated && (
        <div style={{ fontSize: "0.8rem", marginTop: "1rem", opacity: 0.75 }}>
          Last update: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default LiveQuotes;

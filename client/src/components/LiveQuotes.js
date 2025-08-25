import React, { useEffect, useState } from "react";
import { Card, Spinner, Button } from "react-bootstrap";
import axios from "axios";

const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NFLX", "NVDA"];

const LiveQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        STOCK_SYMBOLS.map(async (symbol) => {
          const res = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=d1sffn9r01qqlgb2vfv0d1sffn9r01qqlgb2vfvg`
          );
          return {
            symbol,
            current: res.data.c,
            open: res.data.o,
            high: res.data.h,
            low: res.data.l,
            previousClose: res.data.pc,
            change: res.data.c - res.data.pc,
          };
        })
      );
      setQuotes(results);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

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
          textShadow: "0 0 6px rgba(0,123,255,0.4)"
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
          {quotes.map(({ symbol, current, change, open, high, low, previousClose }) => {
            const isPositive = change >= 0;
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
                    color: isPositive ? "#28a745" : "#dc3545"
                  }}
                >
                  ${current?.toFixed(2)}
                </Card.Subtitle>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: isPositive ? "#28a745" : "#dc3545",
                    marginBottom: "0.5rem"
                  }}
                >
                  {isPositive ? "+" : ""}
                  {change.toFixed(2)} ({((change / previousClose) * 100).toFixed(2)}%)
                </div>
                <div style={{ fontSize: "0.75rem", color: "#555" }}>
                  <div>O: ${open?.toFixed(2)}</div>
                  <div>H: ${high?.toFixed(2)}</div>
                  <div>L: ${low?.toFixed(2)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveQuotes;

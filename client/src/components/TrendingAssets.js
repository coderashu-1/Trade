import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Badge, Spinner, Card } from "react-bootstrap";

const symbols = ["AAPL", "GOOGL", "AMZN", "TSLA", "SPY", "QQQ", "MSFT", "NFLX"];
const apiKey = "d1sffn9r01qqlgb2vfv0d1sffn9r01qqlgb2vfvg";

const RealTimeTable = () => {
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    const results = {};
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const res = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
          );
          results[symbol] = res.data;
        } catch {
          results[symbol] = null;
        }
      })
    );
    setQuotes(results);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []); // only once on mount

  const renderChange = (d, dp) => {
    const color =
      d > 0 ? "success" : d < 0 ? "danger" : "secondary";
    const sign = d > 0 ? "▲" : d < 0 ? "▼" : "";
    const gradient =
      d > 0
        ? "linear-gradient(45deg, #28a745, #85e085)"
        : d < 0
        ? "linear-gradient(45deg, #dc3545, #f08a8a)"
        : "gray";

    return (
      <Badge
        style={{
          backgroundImage: gradient,
          fontWeight: "600",
          fontSize: "0.9rem",
          minWidth: "60px",
          display: "inline-block",
          textAlign: "center",
        }}
      >
        {sign} {dp?.toFixed(2)}%
      </Badge>
    );
  };

  return (
    <Card
      bg="dark"
      text="light"
      className="mx-auto my-4 shadow"
      style={{ maxWidth: "900px", borderRadius: "15px" }}
    >
      <Card.Header
        className="d-flex justify-content-between align-items-center"
        style={{
          background:
            "linear-gradient(90deg, #007bff, #00c6ff)",
          borderRadius: "15px 15px 0 0",
          fontWeight: "700",
          fontSize: "1.5rem",
          letterSpacing: "1.2px",
          boxShadow: "0 4px 15px rgba(0, 198, 255, 0.5)",
        }}
      >
        <span>📊 Market Movers</span>
        {lastUpdated && (
          <small
            style={{
              fontWeight: "400",
              fontSize: "0.9rem",
              opacity: 0.75,
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
          >
            Last update: {lastUpdated.toLocaleTimeString()}
          </small>
        )}
      </Card.Header>

      <Card.Body
        style={{
          overflowX: "auto",
          transition: "background-color 0.3s ease",
        }}
      >
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner
              animation="border"
              variant="info"
              style={{ width: "3rem", height: "3rem" }}
            />
          </div>
        ) : (
          <Table
            striped
            bordered
            hover
            variant="dark"
            responsive
            style={{ fontSize: "1rem" }}
          >
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Price</th>
                <th>Change %</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym) => {
                const q = quotes[sym];
                return q ? (
                  <tr
                    key={sym}
                    style={{
                      animation: "fadeIn 0.5s ease forwards",
                      backgroundColor:
                        q.d > 0
                          ? "rgba(40, 167, 69, 0.1)"
                          : q.d < 0
                          ? "rgba(220, 53, 69, 0.1)"
                          : "transparent",
                      fontWeight: "600",
                    }}
                  >
                    <td>{sym}</td>
                    <td>${q.c.toFixed(2)}</td>
                    <td>{renderChange(q.d, q.dp)}</td>
                    <td>${q.o.toFixed(2)}</td>
                    <td>${q.h.toFixed(2)}</td>
                    <td>${q.l.toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr key={sym}>
                    <td>{sym}</td>
                    <td colSpan="5" className="text-danger text-center">
                      Failed to fetch
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </Card>
  );
};

export default RealTimeTable;

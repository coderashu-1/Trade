import React, { useEffect, useState } from "react";
import logo from "../assets/wsb_logo.png";
import { Badge, Col, Row, Image, Container, Spinner } from "react-bootstrap";

const TICKERS = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN"];
const FINNHUB_KEY = "d1sffn9r01qqlgb2vfv0d1sffn9r01qqlgb2vfvg";

const StockNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(null);

  const fetchNews = async (symbol) => {
    setLoading(true);
    const from = new Date(Date.now() - 7 * 86400e3).toISOString().split("T")[0];
    const to = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
      );
      const data = await res.json();
      setNews(data.slice(0, 5));
    } catch (err) {
      console.error("News fetch error:", err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialTicker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
    setFilter(initialTicker);
    fetchNews(initialTicker);
  }, []);

  return (
    <Container className="mt-4" style={{ maxWidth: "900px" }}>
      <h3
        className="text-center mb-4"
        style={{
          fontWeight: "700",
          letterSpacing: "1.5px",
          background: "linear-gradient(90deg, #007bff, #00c6ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 8px rgba(0, 198, 255, 0.5)",
          userSelect: "none",
        }}
      >
        Latest Stock News
      </h3>

      <div className="text-center mb-3">
        {TICKERS.map((sym) => (
          <Badge
            key={sym}
            bg={filter === sym ? "primary" : "secondary"}
            className="m-1 p-2 pointer"
            style={{
              cursor: "pointer",
              fontWeight: "600",
              transition: "background-color 0.3s ease",
              minWidth: "50px",
              userSelect: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
            }}
            onClick={() => {
              setFilter(sym);
              fetchNews(sym);
            }}
          >
            {sym}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
        </div>
      ) : news.length === 0 ? (
        <p className="text-center text-muted" style={{ fontStyle: "italic" }}>
          No recent news found.
        </p>
      ) : (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
          {news.map((item, i) => (
            <Row
              key={i}
              className="align-items-center py-3 mb-3"
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
              }}
              onClick={() => window.open(item.url, "_blank")}
            >
              <Col xs={4} md={2} style={{ maxWidth: "120px" }}>
                <Image
                  src={item.image || logo}
                  rounded
                  fluid
                  style={{
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    borderRadius: "12px",
                    backgroundColor: "#ddd",
                  }}
                  onError={(e) => (e.target.src = logo)}
                />
              </Col>
              <Col xs={8} md={10}>
                <h5
                  style={{
                    fontWeight: "700",
                    marginBottom: "0.3rem",
                    color: "#007bff",
                    userSelect: "text",
                  }}
                >
                  {filter}
                </h5>
                <p
                  style={{
                    marginBottom: "0.25rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#333",
                    userSelect: "text",
                  }}
                >
                  {item.headline.length > 90 ? item.headline.slice(0, 90) + "…" : item.headline}
                </p>
                <small
                  className="text-muted"
                  style={{ fontSize: "0.85rem", userSelect: "text" }}
                >
                  {item.source} – {new Date(item.datetime * 1000).toLocaleDateString()}
                </small>
              </Col>
            </Row>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {opacity: 0;}
          to {opacity: 1;}
        }
        .pointer { cursor: pointer; }
      `}</style>
    </Container>
  );
};

export default StockNews;

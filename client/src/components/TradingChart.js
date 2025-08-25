import React, { useEffect, useRef, useState } from "react";

const TradingChart = () => {
  const containerRef = useRef(null);
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const [inputValue, setInputValue] = useState(symbol);

  const loadChart = (selectedSymbol) => {
    if (!window.TradingView) return;

    // Clear previous chart
    containerRef.current.innerHTML = "";

    new window.TradingView.widget({
      container_id: "tradingview_chart",
      width: "100%",
      height: "500px",
      symbol: selectedSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
    });
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      loadChart(symbol);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Reload chart when symbol changes
  useEffect(() => {
    if (window.TradingView) {
      loadChart(symbol);
    }
  }, [symbol]);

  // Handle form submit to update symbol
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      setSymbol(inputValue.trim().toUpperCase());
    }
  };

  return (
    <div>
      {/* <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter stock symbol (e.g. NASDAQ:AAPL)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ padding: "0.5rem", width: "300px" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}>
          Load
        </button>
      </form> */}

      <div id="tradingview_chart" ref={containerRef}></div>
    </div>
  );
};

export default TradingChart;

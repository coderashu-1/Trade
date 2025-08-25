import React, { useEffect, useRef, useState } from "react";

const TradingChart = () => {
  const containerRef = useRef(null);
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");

  const loadChart = (selectedSymbol) => {
    if (!window.TradingView || !containerRef.current) return;

    // Clear previous chart
    containerRef.current.innerHTML = "";

    new window.TradingView.widget({
      container_id: containerRef.current.id,
      width: "100%",
      height: 500,
      symbol: selectedSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: 1,
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
    });
  };

  // Load TradingView script once
  useEffect(() => {
    if (window.TradingView) {
      loadChart(symbol);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => loadChart(symbol);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [symbol]); // include symbol to reload safely

  return <div id="tradingview_chart" ref={containerRef}></div>;
};

export default TradingChart;

import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

const LivePriceChart = ({ tradingPair, entryPrice, isBetting, currentPrice }) => {
  const chartContainerRef = useRef();
  const candleSeriesRef = useRef();
  const strikeLineRef = useRef();

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#0f0f0f" },
        textColor: "#fff",
      },
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candleSeries = chart.addCandlestickSeries();
    candleSeriesRef.current = candleSeries;

    // Mock historical data
    const now = Math.floor(Date.now() / 1000);
    const data = [];
    let lastClose = 10000 + Math.random() * 100;
    for (let i = 60; i > 0; i--) {
      const open = lastClose;
      const close = open + (Math.random() - 0.5) * 20;
      const high = Math.max(open, close) + Math.random() * 10;
      const low = Math.min(open, close) - Math.random() * 10;
      lastClose = close;

      data.push({
        time: now - i * 60,
        open,
        high,
        low,
        close,
      });
    }
    candleSeries.setData(data);

    // Resize listener
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [tradingPair]);

  // Strike price line
  useEffect(() => {
    if (isBetting && entryPrice) {
      strikeLineRef.current = candleSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: "#ffcc00",
        lineWidth: 2,
        lineStyle: 1,
        axisLabelVisible: true,
        title: "Strike Price",
      });
    } else if (!isBetting && strikeLineRef.current) {
      candleSeriesRef.current.removePriceLine(strikeLineRef.current);
      strikeLineRef.current = null;
    }
  }, [isBetting, entryPrice]);

  // Live price updates
  useEffect(() => {
    if (currentPrice && candleSeriesRef.current) {
      const time = Math.floor(Date.now() / 1000);
      candleSeriesRef.current.update({
        time,
        open: currentPrice,
        high: currentPrice + Math.random() * 5,
        low: currentPrice - Math.random() * 5,
        close: currentPrice,
      });
    }
  }, [currentPrice]);

  return <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />;
};

export default LivePriceChart;

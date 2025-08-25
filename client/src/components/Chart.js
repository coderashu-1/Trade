// Chart.js
import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

const Chart = ({ entryPrice, isBetting }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const lineRef = useRef();

  useEffect(() => {
    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#0f0f0f" },
        textColor: "#d1d4dc"
      },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" }
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight
    });

    const series = chartRef.current.addLineSeries();

    let i = 0;
    const interval = setInterval(() => {
      const time = Math.floor(Date.now() / 1000);
      const price = 10000 + Math.random() * 500;
      series.update({ time, value: price });
      i++;
      if (i > 100) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isBetting && entryPrice && chartRef.current) {
      if (lineRef.current) chartRef.current.removePriceLine(lineRef.current);

      const series = chartRef.current.lineSeries();
      lineRef.current = series.createPriceLine({
        price: entryPrice,
        color: "yellow",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `Entry: $${entryPrice}`
      });
    }
  }, [entryPrice, isBetting]);

  return <div ref={chartContainerRef} style={{ height: "90vh", width: "100%" }} />;
};

export default Chart;

"use client";

import React from "react";
import Chart, { Props } from "react-apexcharts";
import Box from "../box";

const SalesChart = ({
  ordersData,
}: {
  ordersData?: { month: string; count: number }[];
}) => {
  // Chart data (Y-axis)
  const chartSeries: Props["series"] = [
    {
      name: "Sales",
      data: ordersData?.map((data) => data.count) || [
        31, 40, 28, 51, 42, 109, 100,
      ],
    },
  ];

  // Chart configuration (X-axis, styles, etc.)
  const chartOptions: Props["options"] = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      strokeDashArray: 4,
    },
    xaxis: {
      categories: ordersData?.map((data) => data.month) || [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
      ],
    },
    yaxis: {
      title: { text: "Orders" },
    },
    tooltip: {
      theme: "dark",
    },
  };

  return (
    <Box>
      <h2 className="text-lg font-semibold mb-4">Monthly Sales</h2>
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="line"
        height={350}
      />
    </Box>
  );
};

export default SalesChart;

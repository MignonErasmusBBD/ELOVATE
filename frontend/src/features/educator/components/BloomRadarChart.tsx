"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { BloomCoveragePoint } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type BloomRadarChartProps = {
  bloomCoverage: BloomCoveragePoint[];
};

export function BloomRadarChart({ bloomCoverage }: BloomRadarChartProps) {
  const categories = bloomCoverage.map((point) => point.levelName);

  const options: ApexOptions = {
    chart: {
      type: "radar",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
    },
    colors: ["#FF6B4A", "#1E1B33"],
    stroke: { width: 2 },
    fill: { opacity: 0.25 },
    markers: { size: 4 },
    xaxis: {
      categories,
    },
    yaxis: {
      show: false,
    },
    legend: {
      position: "bottom",
    },
    tooltip: {
      theme: "light",
    },
  };

  const series = [
    {
      name: "Coverage",
      data: bloomCoverage.map((point) => point.coverageCount),
    },
    {
      name: "Performance",
      data: bloomCoverage.map((point) => point.performancePercent),
    },
  ];

  return (
    <figure className="m-0 w-full">
      <Chart type="radar" height={340} options={options} series={series} />
    </figure>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import {
  formatBloomCoverageTooltip,
  formatBloomPerformanceTooltip,
  toBloomRadarSeriesPoints,
} from "@/helpers/bloomRadarChart";
import type { BloomCoveragePoint } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type BloomRadarChartProps = {
  bloomCoverage: BloomCoveragePoint[];
};

export function BloomRadarChart({ bloomCoverage }: BloomRadarChartProps) {
  const radarPoints = toBloomRadarSeriesPoints(bloomCoverage);
  const categories = radarPoints.map((point) => point.levelName);

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
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: {
        formatter: (value) => {
          if (value === 0) {
            return "";
          }
          return `${Math.round(value)}%`;
        },
      },
    },
    legend: {
      position: "bottom",
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value, opts) => {
          if (typeof value !== "number" || opts === undefined) {
            return "";
          }
          const point = radarPoints[opts.dataPointIndex];
          if (point === undefined) {
            return `${Math.round(value)}%`;
          }
          if (opts.seriesIndex === 0) {
            return formatBloomCoverageTooltip(
              point.coveragePercent,
              point.coverageCount,
            );
          }
          return formatBloomPerformanceTooltip(point.performancePercent);
        },
      },
    },
  };

  const series = [
    {
      name: "Coverage (% of questions)",
      data: radarPoints.map((point) => point.coveragePercent),
    },
    {
      name: "Performance (% correct)",
      data: radarPoints.map((point) => point.performancePercent),
    },
  ];

  return (
    <figure className="m-0 w-full">
      <Chart type="radar" height={340} options={options} series={series} />
    </figure>
  );
}

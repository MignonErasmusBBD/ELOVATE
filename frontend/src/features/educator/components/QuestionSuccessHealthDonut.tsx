"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type QuestionSuccessHealthCounts = {
  tooHardCount: number;
  tooEasyCount: number;
  balancedCount: number;
  insufficientDataCount: number;
};

type QuestionSuccessHealthDonutProps = {
  counts: QuestionSuccessHealthCounts;
};

export function QuestionSuccessHealthDonut({
  counts,
}: QuestionSuccessHealthDonutProps) {
  const labels = [
    "Needs revision",
    "Too easy",
    "Balanced",
    "Thin sample",
  ];
  const series = [
    counts.tooHardCount,
    counts.tooEasyCount,
    counts.balancedCount,
    counts.insufficientDataCount,
  ];
  const total =
    counts.tooHardCount +
    counts.tooEasyCount +
    counts.balancedCount +
    counts.insufficientDataCount;

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
    },
    labels,
    colors: ["#F43F5E", "#F59E0B", "#10B981", "#A8A3B8"],
    stroke: {
      width: 2,
      colors: ["#FFFFFF"],
    },
    legend: {
      position: "bottom",
      fontSize: "12px",
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              color: "#5A5670",
            },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 700,
              color: "#1E1B33",
              formatter: (value) => `${value}`,
            },
            total: {
              show: true,
              label: "Answered",
              fontSize: "12px",
              color: "#5A5670",
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => {
          if (typeof value !== "number") {
            return "—";
          }
          if (total === 0) {
            return `${Math.round(value)}`;
          }
          const share = Math.round((value / total) * 100);
          return `${Math.round(value)} (${share}%)`;
        },
      },
    },
  };

  return (
    <figure className="m-0 w-full max-w-sm justify-self-center">
      <Chart type="donut" height={300} options={options} series={series} />
    </figure>
  );
}

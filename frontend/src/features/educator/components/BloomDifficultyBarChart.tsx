"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { BloomDifficultyStat } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type BloomDifficultyBarChartProps = {
  bloomDifficulty: BloomDifficultyStat[];
};

export function BloomDifficultyBarChart({
  bloomDifficulty,
}: BloomDifficultyBarChartProps) {
  const categories = bloomDifficulty.map((entry) => entry.levelName);

  let maxQuestionCount = 0;
  for (const entry of bloomDifficulty) {
    const stackedCount =
      entry.easyCount + entry.mediumCount + entry.hardCount;
    if (stackedCount > maxQuestionCount) {
      maxQuestionCount = stackedCount;
    }
  }
  const yAxisMax = maxQuestionCount < 1 ? 1 : maxQuestionCount;

  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
      },
    },
    colors: ["#10B981", "#F59E0B", "#F43F5E"],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
      title: {
        text: "Bloom Level",
        style: { color: "#5A5670", fontWeight: 600 },
      },
    },
    yaxis: {
      min: 0,
      max: yAxisMax,
      tickAmount: yAxisMax,
      forceNiceScale: false,
      decimalsInFloat: 0,
      labels: {
        formatter: (value) => `${Math.round(value)}`,
      },
      title: {
        text: "Number of Questions",
        style: { color: "#5A5670", fontWeight: 600 },
      },
    },
    legend: {
      position: "top",
    },
    grid: {
      borderColor: "#E4E2EC",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => `${Math.round(value)}`,
      },
    },
  };

  const series = [
    {
      name: "Easy",
      data: bloomDifficulty.map((entry) => entry.easyCount),
    },
    {
      name: "Medium",
      data: bloomDifficulty.map((entry) => entry.mediumCount),
    },
    {
      name: "Hard",
      data: bloomDifficulty.map((entry) => entry.hardCount),
    },
  ];

  return (
    <figure className="m-0 w-full">
      <Chart type="bar" height={320} options={options} series={series} />
    </figure>
  );
}

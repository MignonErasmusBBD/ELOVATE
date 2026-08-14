"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { EducatorStudentCognitiveLevel } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type StudentCognitiveLevelChartProps = {
  cognitiveLevels: EducatorStudentCognitiveLevel[];
};

export function StudentCognitiveLevelChart({
  cognitiveLevels,
}: StudentCognitiveLevelChartProps) {
  const categories = cognitiveLevels.map((level) => level.levelName);
  const seriesData = cognitiveLevels.map((level) => level.percentCorrect);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "55%",
        dataLabels: {
          position: "center",
        },
      },
    },
    colors: ["#1E1B33"],
    dataLabels: {
      enabled: true,
      textAnchor: "middle",
      formatter: (value, opts) => {
        if (opts === undefined) {
          return "";
        }
        const questionCount =
          cognitiveLevels[opts.dataPointIndex]?.questionCount;
        if (typeof value !== "number" || questionCount === undefined) {
          return "";
        }
        return `${value}% (${questionCount} Questions)`;
      },
      style: {
        colors: ["#FFFFFF"],
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    xaxis: {
      categories,
      max: 100,
    },
    grid: {
      borderColor: "#E4E2EC",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => `${value}%`,
      },
    },
  };

  const series = [{ name: "Performance", data: seriesData }];

  return (
    <figure className="m-0 w-full">
      <Chart type="bar" height={280} options={options} series={series} />
    </figure>
  );
}

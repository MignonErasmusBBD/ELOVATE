"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { CognitiveLevelPerformance } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type CognitiveLevelChartProps = {
  cognitiveLevelPerformance: CognitiveLevelPerformance[];
};

export function CognitiveLevelChart({
  cognitiveLevelPerformance,
}: CognitiveLevelChartProps) {
  const categories = cognitiveLevelPerformance.map(
    (entry) => entry.levelName,
  );
  const seriesData = cognitiveLevelPerformance.map(
    (entry) => entry.percentCorrect,
  );

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
      offsetX: 0,
      formatter: (value, opts) => {
        if (opts === undefined) {
          return "";
        }

        const questionCount =
          cognitiveLevelPerformance[opts.dataPointIndex]?.questionCount;
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
      background: {
        enabled: false,
      },
    },
    xaxis: {
      categories,
      max: 100,
      labels: {
        style: {
          colors: ["#5A5670"],
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: ["#1E1B33"],
          fontSize: "13px",
          fontWeight: 600,
        },
      },
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

  const series = [
    {
      name: "Performance",
      data: seriesData,
    },
  ];

  return (
    <figure className="m-0 w-full">
      <Chart
        type="bar"
        height={320}
        options={options}
        series={series}
        width="100%"
      />
    </figure>
  );
}

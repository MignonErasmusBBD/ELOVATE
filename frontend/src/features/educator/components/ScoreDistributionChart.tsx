"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { PracticeDensityPoint } from "@/helpers/educatorPracticeInsightsApi";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ScoreDistributionChartProps = {
  densityCurve: PracticeDensityPoint[];
  idealDensityCurve: PracticeDensityPoint[];
  classMeanPercent?: number;
  idealMeanPercent: number;
};

type ChartPoint = {
  x: number;
  y: number;
};

function toChartPoints(curve: PracticeDensityPoint[]): ChartPoint[] {
  return curve.map((point) => ({
    x: point.scorePercent,
    y: point.density,
  }));
}

export function ScoreDistributionChart({
  densityCurve,
  idealDensityCurve,
  classMeanPercent,
  idealMeanPercent,
}: ScoreDistributionChartProps) {
  const classSeriesData = toChartPoints(densityCurve);
  const idealSeriesData = toChartPoints(
    idealDensityCurve.length > 0 ? idealDensityCurve : densityCurve,
  );

  const idealCurveColor = "#C5C1D4";
  const classCurveColor = "#FF6B4A";

  const xaxisAnnotations: NonNullable<
    NonNullable<ApexOptions["annotations"]>["xaxis"]
  > = [
    {
      x: idealMeanPercent,
      borderColor: idealCurveColor,
      strokeDashArray: 6,
      borderWidth: 2,
      label: {
        text: `Ideal mean ${Math.round(idealMeanPercent)}%`,
        orientation: "horizontal",
        position: "top",
        style: {
          color: "#5A5670",
          background: "#EEECF4",
          fontSize: "11px",
          padding: {
            left: 6,
            right: 6,
            top: 3,
            bottom: 3,
          },
        },
      },
    },
  ];

  if (classMeanPercent !== undefined) {
    xaxisAnnotations.push({
      x: classMeanPercent,
      borderColor: classCurveColor,
      strokeDashArray: 0,
      borderWidth: 2,
      label: {
        text: `Class mean ${Math.round(classMeanPercent)}%`,
        orientation: "horizontal",
        position: "top",
        offsetY: -8,
        style: {
          color: "#FFFFFF",
          background: classCurveColor,
          fontSize: "11px",
          padding: {
            left: 6,
            right: 6,
            top: 3,
            bottom: 3,
          },
        },
      },
    });
  }

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
      zoom: { enabled: false },
    },
    colors: [classCurveColor, idealCurveColor],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: [3, 2],
      dashArray: [0, 6],
    },
    fill: {
      type: ["gradient", "solid"],
      opacity: [0.35, 0],
      gradient: {
        shadeIntensity: 0.4,
        opacityFrom: 0.45,
        opacityTo: 0.05,
      },
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: "numeric",
      min: 0,
      max: 100,
      tickAmount: 10,
      title: { text: "Learner average score %" },
      labels: {
        formatter: (value) => {
          if (typeof value !== "string" && typeof value !== "number") {
            return "";
          }
          const score =
            typeof value === "number" ? value : Number.parseFloat(value);
          if (Number.isFinite(score) === false) {
            return "";
          }
          return `${Math.round(score)}`;
        },
      },
    },
    yaxis: {
      min: 0,
      title: { text: "Relative density" },
      labels: {
        formatter: (value) => {
          if (typeof value !== "number") {
            return "";
          }
          return `${Math.round(value * 100) / 100}`;
        },
      },
    },
    legend: {
      position: "bottom",
      show: true,
    },
    tooltip: {
      theme: "light",
      shared: true,
      x: {
        formatter: (value) => {
          if (typeof value !== "number") {
            return "";
          }
          return `${Math.round(value)}%`;
        },
      },
      y: {
        formatter: (value) => {
          if (typeof value !== "number") {
            return "—";
          }
          return `${Math.round(value * 1000) / 1000}`;
        },
      },
    },
    annotations: {
      xaxis: xaxisAnnotations,
    },
  };

  const series = [
    {
      name: "Class distribution",
      data: classSeriesData,
    },
    {
      name: "Ideal bell curve",
      data: idealSeriesData,
    },
  ];

  return (
    <figure className="m-0 w-full">
      <Chart type="area" height={360} options={options} series={series} />
    </figure>
  );
}

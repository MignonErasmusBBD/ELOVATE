"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { InterventionRuleFlag } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type InterventionRuleFlagChartProps = {
  interventionRuleFlags: InterventionRuleFlag[];
};

export function InterventionRuleFlagChart({
  interventionRuleFlags,
}: InterventionRuleFlagChartProps) {
  const categories = interventionRuleFlags.map((flag) => flag.ruleLabel);
  const seriesData = interventionRuleFlags.map(
    (flag) => flag.flaggedStudentCount,
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
        borderRadius: 6,
        columnWidth: "45%",
        distributed: true,
      },
    },
    colors: ["#FF6B4A", "#1E1B33", "#F59E0B", "#38BDF8"],
    dataLabels: {
      enabled: true,
      style: {
        colors: ["#FFFFFF"],
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#5A5670",
          fontSize: "11px",
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of students flagged",
        style: { color: "#5A5670", fontWeight: 600 },
      },
      labels: {
        formatter: (value) => `${Math.round(value)}`,
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      borderColor: "#E4E2EC",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => `${value} students`,
      },
    },
  };

  const series = [
    {
      name: "Students flagged",
      data: seriesData,
    },
  ];

  return (
    <figure className="m-0 w-full">
      <Chart type="bar" height={320} options={options} series={series} />
    </figure>
  );
}

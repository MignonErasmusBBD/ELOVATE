"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { QuestionSectionStat } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type QuestionSectionPolarChartProps = {
  questionSections: QuestionSectionStat[];
};

export function QuestionSectionPolarChart({
  questionSections,
}: QuestionSectionPolarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "polarArea",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
    },
    labels: questionSections.map((section) => section.sectionName),
    colors: ["#38BDF8", "#1E1B33", "#FF6B4A", "#F43F5E"],
    stroke: { colors: ["#FFFFFF"] },
    fill: { opacity: 0.9 },
    legend: {
      position: "bottom",
    },
    yaxis: {
      show: false,
    },
    tooltip: {
      theme: "light",
    },
  };

  const series = questionSections.map((section) => section.questionCount);

  return (
    <figure className="m-0 w-full">
      <Chart type="polarArea" height={340} options={options} series={series} />
    </figure>
  );
}

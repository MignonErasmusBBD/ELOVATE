"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { ExplainTip } from "@/components/ui/ExplainTip";
import { explainCopy } from "@/helpers/explainCopy";
import type { TrendAttempt } from "@/helpers/studentDashboardApi";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type AttemptsTrendChartProps = {
  trendAttempts: TrendAttempt[];
  overallAvgScorePercent: number | undefined;
  totalAttempts: number;
};

export function AttemptsTrendChart({
  trendAttempts,
  overallAvgScorePercent,
  totalAttempts,
}: AttemptsTrendChartProps) {
  const heading = (
    <header className="flex items-center gap-2">
      <h2 className="text-xl font-bold tracking-tight text-ink">
        Recent attempts
      </h2>
      <ExplainTip label="About recent attempts">
        {explainCopy.studentRecentAttempts}
      </ExplainTip>
    </header>
  );

  if (totalAttempts < 3) {
    return (
      <section aria-labelledby="trend-heading">
        {heading}
        <p className="mt-6 rounded-xl border border-border-ui bg-page px-5 py-6 text-sm text-text-secondary">
          Keep practising — your trend will appear here once you have completed
          at least 3 quizzes.
        </p>
      </section>
    );
  }

  const categories = trendAttempts.map((a) => `#${a.attemptNumber}`);
  const seriesData = trendAttempts.map((a) => Math.round(a.scorePercent * 10) / 10);

  const annotations: ApexOptions["annotations"] = overallAvgScorePercent !== undefined
    ? {
        yaxis: [
          {
            y: Math.round(overallAvgScorePercent * 10) / 10,
            borderColor: "#5A5670",
            borderWidth: 2,
            strokeDashArray: 6,
            label: {
              text: `Avg ${Math.round(overallAvgScorePercent)}%`,
              style: {
                color: "#5A5670",
                background: "transparent",
                fontSize: "11px",
                fontWeight: 500,
              },
              position: "right",
              offsetX: -4,
            },
          },
        ],
      }
    : {};

  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
      zoom: { enabled: false },
    },
    colors: ["#FF6B4A"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 5,
      colors: ["#FFFFFF"],
      strokeColors: "#FF6B4A",
      strokeWidth: 2,
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: "#5A5670", fontSize: "12px" },
      },
      title: {
        text: "Attempt",
        style: { color: "#5A5670", fontSize: "11px", fontWeight: 400 },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        formatter: (v) => `${v}%`,
        style: { colors: "#5A5670", fontSize: "12px" },
      },
    },
    grid: {
      borderColor: "#E4E2EC",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      y: { formatter: (v) => `${v}%` },
    },
    annotations,
  };

  const sub =
    trendAttempts.length < totalAttempts
      ? `Showing last ${trendAttempts.length} of ${totalAttempts} attempts`
      : `${totalAttempts} attempt${totalAttempts === 1 ? "" : "s"} total`;

  return (
    <section aria-labelledby="trend-heading">
      {heading}
      <p className="mt-1 text-sm text-text-secondary">{sub}</p>
      <figure className="m-0 mt-4 w-full">
        <Chart
          type="line"
          height={280}
          options={options}
          series={[{ name: "Score", data: seriesData }]}
          width="100%"
        />
      </figure>
    </section>
  );
}

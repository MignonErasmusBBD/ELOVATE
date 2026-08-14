"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { PracticeQuizAttempt } from "../types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ATTEMPTS_PER_WINDOW = 7;

type PracticeQuizProgressChartProps = {
  practiceQuizAttempts: PracticeQuizAttempt[];
};

export function PracticeQuizProgressChart({
  practiceQuizAttempts,
}: PracticeQuizProgressChartProps) {
  const chronologicalAttempts = [...practiceQuizAttempts].sort((left, right) =>
    left.completedAt.localeCompare(right.completedAt),
  );
  const totalAttemptCount = chronologicalAttempts.length;
  const windowCount =
    totalAttemptCount === 0
      ? 1
      : Math.ceil(totalAttemptCount / ATTEMPTS_PER_WINDOW);

  const latestWindowIndex = windowCount - 1;
  const [historyWindowIndex, setHistoryWindowIndex] =
    useState(latestWindowIndex);

  const windowStartIndex = historyWindowIndex * ATTEMPTS_PER_WINDOW;
  const visibleAttempts = chronologicalAttempts.slice(
    windowStartIndex,
    windowStartIndex + ATTEMPTS_PER_WINDOW,
  );

  const hasOlderAttempts = historyWindowIndex > 0;
  const hasNewerAttempts = historyWindowIndex < latestWindowIndex;
  const isViewingLatestWindow = historyWindowIndex === latestWindowIndex;

  const categories = visibleAttempts.map((attempt) => attempt.attemptLabel);
  const seriesData = visibleAttempts.map((attempt) => attempt.scorePercent);

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
      zoom: { enabled: false },
    },
    colors: ["#FF6B4A"],
    dataLabels: {
      enabled: true,
      formatter: (value) => {
        if (typeof value !== "number") {
          return "";
        }
        return `${value}%`;
      },
      style: {
        colors: ["#FFFFFF"],
        fontSize: "11px",
        fontWeight: 600,
      },
      background: {
        enabled: true,
        foreColor: "#FFFFFF",
        backgroundColor: "#1E1B33",
        padding: 6,
        borderRadius: 4,
        borderWidth: 0,
        opacity: 1,
        dropShadow: {
          enabled: false,
        },
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    markers: {
      size: 5,
      colors: ["#FFFFFF"],
      strokeColors: "#FF6B4A",
      strokeWidth: 2,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#5A5670",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        formatter: (value) => `${value}%`,
        style: {
          colors: "#5A5670",
          fontSize: "12px",
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
      name: "Quiz score",
      data: seriesData,
    },
  ];

  const rangeStart = windowStartIndex + 1;
  const rangeEnd = windowStartIndex + visibleAttempts.length;

  return (
    <section aria-labelledby="practice-quiz-progress-heading">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <section className="min-w-0">
          <h2
            id="practice-quiz-progress-heading"
            className="text-xl font-bold tracking-tight text-ink"
          >
            Practice quiz progress
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {isViewingLatestWindow
              ? "Latest 7 attempts"
              : `Attempts ${rangeStart}–${rangeEnd} of ${totalAttemptCount}`}
          </p>
        </section>
        <nav
          aria-label="Attempt history"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            disabled={hasOlderAttempts === false}
            onClick={() =>
              setHistoryWindowIndex((currentIndex) => currentIndex - 1)
            }
            className="rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            Older
          </button>
          <button
            type="button"
            disabled={hasNewerAttempts === false}
            onClick={() =>
              setHistoryWindowIndex((currentIndex) => currentIndex + 1)
            }
            className="rounded-lg border border-border-ui bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            Newer
          </button>
          <button
            type="button"
            disabled={isViewingLatestWindow}
            onClick={() => setHistoryWindowIndex(latestWindowIndex)}
            className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Latest 7
          </button>
        </nav>
      </header>

      {visibleAttempts.length === 0 ? (
        <p className="mt-6 text-sm text-text-secondary">
          No practice quiz attempts yet.
        </p>
      ) : (
        <figure className="m-0 mt-4 w-full">
          <Chart
            type="area"
            height={300}
            options={options}
            series={series}
            width="100%"
          />
        </figure>
      )}
    </section>
  );
}

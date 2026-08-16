"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type {
  PracticeAttemptAverage,
  PracticeOutlierStudent,
} from "@/helpers/educatorPracticeInsightsApi";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ATTEMPT_CATEGORIES = [
  "Attempt 1",
  "Attempt 2",
  "Attempt 3",
  "Attempt 4",
  "Attempt 5",
  "Attempt 6",
];

const OUTLIER_COLORS = [
  "#2F80ED",
  "#9B51E0",
  "#27AE60",
  "#F2994A",
  "#EB5757",
  "#56CCF2",
];

type AttemptProgressChartProps = {
  courseWideAveragePercent?: number;
  attemptAverages: PracticeAttemptAverage[];
  outliers?: PracticeOutlierStudent[];
};

function scoreForAttempt(
  attemptAverages: PracticeAttemptAverage[],
  attemptNumber: number,
): number | undefined {
  for (const average of attemptAverages) {
    if (average.attemptNumber === attemptNumber) {
      return average.averagePercent;
    }
  }
  return undefined;
}

function outlierScoreForAttempt(
  outlier: PracticeOutlierStudent,
  attemptNumber: number,
): number | undefined {
  for (const attempt of outlier.attemptScores) {
    if (attempt.attemptNumber === attemptNumber) {
      return attempt.scorePercent;
    }
  }
  return undefined;
}

export function AttemptProgressChart({
  courseWideAveragePercent,
  attemptAverages,
  outliers = [],
}: AttemptProgressChartProps) {
  const classAverageData = ATTEMPT_CATEGORIES.map((_, index) => {
    const score = scoreForAttempt(attemptAverages, index + 1);
    return score === undefined ? null : score;
  });

  const courseWideData =
    courseWideAveragePercent === undefined
      ? undefined
      : ATTEMPT_CATEGORIES.map(() => courseWideAveragePercent);

  const series: { name: string; data: Array<number | null> }[] = [
    {
      name: "Class average",
      data: classAverageData,
    },
  ];

  if (courseWideData !== undefined) {
    series.push({
      name: "Course-wide average",
      data: courseWideData,
    });
  }

  for (const outlier of outliers) {
    const directionLabel =
      outlier.direction === "above" ? "above cohort" : "below cohort";
    series.push({
      name: `${outlier.fullName} (${directionLabel})`,
      data: ATTEMPT_CATEGORIES.map((_, index) => {
        const score = outlierScoreForAttempt(outlier, index + 1);
        return score === undefined ? null : score;
      }),
    });
  }

  const referenceSeriesCount = courseWideData === undefined ? 1 : 2;
  const strokeWidths = series.map((_, index) => (index === 0 ? 3 : 2.5));
  const strokeDashes = series.map((_, index) => {
    if (index === 1 && courseWideData !== undefined) {
      return 6;
    }
    return 0;
  });
  const markerSizes = series.map((_, index) => {
    if (index === 0) {
      return 4;
    }
    if (index < referenceSeriesCount) {
      return 0;
    }
    return 5;
  });

  const colors = [
    "#FF6B4A",
    "#1E1B33",
    ...outliers.map((_, index) => {
      const color = OUTLIER_COLORS[index % OUTLIER_COLORS.length];
      if (color === undefined) {
        return "#2F80ED";
      }
      return color;
    }),
  ];

  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
      foreColor: "#5A5670",
      zoom: { enabled: false },
    },
    colors,
    stroke: {
      width: strokeWidths,
      dashArray: strokeDashes,
      curve: "smooth",
    },
    markers: {
      size: markerSizes,
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ATTEMPT_CATEGORIES,
      title: { text: "Practice attempt" },
    },
    yaxis: {
      min: 0,
      max: 100,
      title: { text: "Score %" },
      labels: {
        formatter: (value) => `${Math.round(value)}%`,
      },
    },
    legend: {
      position: "bottom",
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => {
          if (typeof value !== "number") {
            return "—";
          }
          return `${Math.round(value)}%`;
        },
      },
    },
  };

  return (
    <figure className="m-0 w-full">
      <Chart type="line" height={360} options={options} series={series} />
    </figure>
  );
}

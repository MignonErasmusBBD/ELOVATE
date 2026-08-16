import type { SVGProps } from "react";

export function ClockBoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.9 12.6A9 9 0 1 0 9 21.8" />
      <path d="M12 7v5l2 2" />
      <path d="M16 18l2-4h3l-2 4h3l-4.5 5-1.5-4h-3l2-1z" />
    </svg>
  );
}

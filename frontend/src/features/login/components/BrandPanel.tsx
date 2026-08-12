export function BrandPanel() {
  return (
    <aside className="brand-panel relative flex min-h-[36vh] flex-col overflow-hidden bg-ink text-white md:min-h-screen md:w-[44%] lg:w-[42%]">
      {/* Atmosphere: soft coral bloom + rising motif (marketing surface only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-coral/15 blur-3xl" />
        <div className="absolute -right-16 bottom-1/3 h-64 w-64 rounded-full bg-coral/10 blur-3xl" />
        <svg
          className="absolute inset-x-0 bottom-[18%] h-[42%] w-full opacity-[0.12]"
          viewBox="0 0 400 180"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 140 C 70 120, 110 95, 150 105 S 230 70, 280 45 S 350 20, 400 8"
            stroke="#FF6B4A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="400" cy="8" r="5" fill="#FF6B4A" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between px-8 py-9 md:px-11 md:py-11 lg:px-14 lg:py-12">
        <header className="brand-panel-header">
          <p className="text-[1.65rem] font-bold leading-none tracking-[0.14em] uppercase md:text-[1.85rem]">
            Elovate
          </p>
          <p className="mt-3 max-w-[16rem] text-[0.95rem] font-medium leading-snug text-coral md:mt-3.5 md:text-base">
            Adapts to you. Elevates with you.
          </p>
        </header>

        <div className="brand-panel-mark flex flex-1 items-center justify-center py-8 md:py-10">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 rounded-[28%] bg-coral/25 blur-2xl"
            />
            {/* Inline mark keeps colors crisp without next/image SVG quirks */}
            <svg
              className="relative h-36 w-36 drop-shadow-[0_18px_40px_rgba(0,0,0,0.35)] md:h-48 md:w-48 lg:h-52 lg:w-52"
              viewBox="0 0 512 512"
              role="img"
              aria-label="Elovate ascending line-chart mark"
            >
              <rect
                x="8"
                y="8"
                width="496"
                height="496"
                rx="108"
                fill="#FF6B4A"
              />
              <polyline
                points="122,356 202,314 282,330 352,248 426,180"
                fill="none"
                stroke="#1E1B33"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="122" cy="356" r="16" fill="#FFFFFF" />
              <circle cx="202" cy="314" r="16" fill="#FFFFFF" />
              <circle cx="282" cy="330" r="16" fill="#FFFFFF" />
              <circle cx="352" cy="248" r="16" fill="#FFFFFF" />
              <circle cx="426" cy="180" r="22" fill="#1E1B33" />
            </svg>
          </div>
        </div>

        <footer className="brand-panel-footer max-w-[22rem]">
          <h2 className="text-xl font-semibold leading-snug tracking-tight md:text-[1.65rem] md:leading-snug">
            Designed for clear, accessible learning.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/68 md:text-[0.95rem] md:leading-relaxed">
            Customizable contrast, adjustable typography, and assistive screen
            reader optimization built in from the ground up.
          </p>
          <div className="mt-7 border-t border-white/12 pt-4 md:mt-8">
            <p className="text-[0.7rem] font-medium tracking-[0.04em] text-white/42 md:text-xs">
              Accessible Learning Platform • Version 2.0
            </p>
          </div>
        </footer>
      </div>
    </aside>
  );
}

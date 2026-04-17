import { useId } from "react";
import { cn } from "@/lib/utils";

interface VoyageLoaderProps {
  size?: number;
  className?: string;
}

/**
 * Animated globe-and-ship loader matching the bon VOYAGER brand.
 * The globe grid spins behind a stationary sailing ship.
 * Uses currentColor so text-* utility classes control the color.
 */
export function VoyageLoader({ size = 32, className }: VoyageLoaderProps) {
  const rawId = useId();
  // Sanitise for CSS ident: replace non-alphanumeric chars
  const uid = "vl" + rawId.replace(/[^a-zA-Z0-9]/g, "");

  // Globe geometry in SVG viewBox (0 0 80 80)
  const R = 32;   // globe radius
  const cx = 40;  // globe center x
  const cy = 38;  // globe center y

  // Meridian spacing in SVG units (4 meridians across the diameter)
  const spacing = R * 2 / 4; // = 16

  // CSS px offset for one spacing unit: spacing_svg * (rendered_px / viewBox_px)
  const translatePx = (spacing * size / 80).toFixed(3);

  // Scale strokes so they render at consistent visual weight regardless of size
  const sw = 80 / size;

  // Show ship details only when large enough to be legible
  const showShip = size >= 22;

  // Meridian x positions: enough to fill globe + one tile ahead for seamless wrap
  const meridianXs = [8, 24, 40, 56, 72, 88];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="Loading"
      role="img"
    >
      <defs>
        <clipPath id={`${uid}-c`}>
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
        <style>{`
          @keyframes ${uid}-s {
            from { transform: translateX(0); }
            to   { transform: translateX(-${translatePx}px); }
          }
          .${uid}-m { animation: ${uid}-s 3s linear infinite; }
        `}</style>
      </defs>

      {/* Globe circle */}
      <circle
        cx={cx} cy={cy} r={R}
        fill="currentColor" fillOpacity="0.04"
        stroke="currentColor" strokeWidth={1.5 * sw} strokeOpacity="0.65"
      />

      {/* Grid lines, clipped to globe */}
      <g
        clipPath={`url(#${uid}-c)`}
        stroke="currentColor" fill="none"
        strokeOpacity="0.38" strokeWidth={0.9 * sw}
      >
        {/* Latitude lines (fixed) */}
        <ellipse cx={cx} cy={cy - 20} rx={25} ry={2.5} />
        <ellipse cx={cx} cy={cy - 10} rx={30} ry={2.5} />
        <ellipse cx={cx} cy={cy}      rx={R}  ry={2.5} />
        <ellipse cx={cx} cy={cy + 10} rx={30} ry={2.5} />
        <ellipse cx={cx} cy={cy + 20} rx={25} ry={2.5} />

        {/* Longitude meridians — animated group translates left by one spacing unit */}
        <g className={`${uid}-m`}>
          {meridianXs.map((x, i) => (
            <ellipse key={i} cx={x} cy={cy} rx={2.5} ry={R} />
          ))}
        </g>
      </g>

      {/* Equator dashes extending beyond the globe */}
      <line
        x1={cx - R - 8} y1={cy} x2={cx - R - 1} y2={cy}
        stroke="currentColor" strokeWidth={sw}
        strokeDasharray={`${2.5 * sw} ${2 * sw}`} strokeOpacity="0.28"
      />
      <line
        x1={cx + R + 1} y1={cy} x2={cx + R + 8} y2={cy}
        stroke="currentColor" strokeWidth={sw}
        strokeDasharray={`${2.5 * sw} ${2 * sw}`} strokeOpacity="0.28"
      />

      {/* Ship — stationary, rendered on top of globe */}
      {showShip && (
        <g stroke="currentColor" strokeOpacity="0.82" fill="none">
          {/* Hull */}
          <path
            d="M 21,62 C 31,67 49,67 59,62 L 57,70 C 47,74 33,74 23,70 Z"
            fill="currentColor" fillOpacity="0.1" strokeWidth={1.2 * sw}
          />

          {/* Back (main) mast */}
          <line x1="33" y1="33" x2="33" y2="62" strokeWidth={1.3 * sw} />

          {/* Back square sail */}
          <path
            d="M 23,37 L 41,37 L 40,60 L 24,60 Z"
            fill="currentColor" fillOpacity="0.1" strokeWidth={sw}
          />

          {/* Front mast */}
          <line x1="48" y1="39" x2="48" y2="62" strokeWidth={1.3 * sw} />

          {/* Front square sail */}
          <path
            d="M 41,43 L 57,43 L 56,61 L 42,61 Z"
            fill="currentColor" fillOpacity="0.1" strokeWidth={sw}
          />

          {/* Bowsprit (angled forward pole) */}
          <line x1="21" y1="57" x2="42" y2="44" strokeWidth={1.2 * sw} />

          {/* Fore-sail / jib */}
          <path
            d="M 21,57 L 42,44 L 43,62 Z"
            fill="currentColor" fillOpacity="0.08" strokeWidth={0.9 * sw}
          />

          {/* Flag — back mast */}
          <path
            d="M 33,33 L 40,30 L 33,27 Z"
            fill="currentColor" fillOpacity="0.75" stroke="none"
          />

          {/* Flag — front mast */}
          <path
            d="M 48,39 L 55,36 L 48,33 Z"
            fill="currentColor" fillOpacity="0.75" stroke="none"
          />
        </g>
      )}
    </svg>
  );
}

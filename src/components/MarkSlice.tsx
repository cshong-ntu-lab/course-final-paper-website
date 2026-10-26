// docs/design-v2.md §2.3 — the site's only decoration: a slice of the department
// mark. Green / khaki / grey fields cut apart by white stems that fork like a plant.
//
// Drawing rules (each was a user correction — keep them when editing the paths):
// - all stems are the same width and use non-scaling-stroke;
// - every stem runs past the frame, so the edge cuts it (no round cap inside);
// - each fork starts exactly on the main stem's bezier (de Casteljau point),
//   otherwise a seam shows at the fork;
// - stems diverge — never parallel arcs.
import { coverVariant } from "@/lib/cover";
import { cn } from "@/lib/utils";

const STEM = "fill-none stroke-surface";
const STEM_PROPS = {
  strokeWidth: 9,
  strokeLinecap: "round",
  vectorEffect: "non-scaling-stroke",
  pathLength: 1,
} as const;

// fa / fb / fc rotate through the three tints
const PALETTES = [
  ["fill-tint-green", "fill-tint-khaki", "fill-tint-grey"],
  ["fill-tint-khaki", "fill-tint-grey", "fill-tint-green"],
  ["fill-tint-grey", "fill-tint-green", "fill-tint-khaki"],
] as const;

/** Cover fallback for reports without a cover image (16:9 frame, fills it). */
export function MarkSliceCover({ id, className }: { id: string; className?: string }) {
  const { mirror, palette } = coverVariant(id);
  const [fa, fb, fc] = PALETTES[palette];
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("block size-full", className)}
    >
      <g transform={mirror ? "translate(320 0) scale(-1 1)" : undefined}>
        <rect className={fa} x="-20" y="-20" width="380" height="220" />
        <path className={fb} d="M70 200 C 120 120, 200 72, 345 44 L345 200 Z" />
        <path
          className={fc}
          d="M70 200 C 89 169.6, 112.3 143.8, 141.9 122 C 170 116, 250 120, 345 160 L345 200 Z"
        />
        {/* main stem; side branch forks at t = .38, twig at t = .72 */}
        <path className={STEM} {...STEM_PROPS} d="M70 200 C 120 120, 200 72, 345 44" />
        <path className={STEM} {...STEM_PROPS} d="M141.9 122 C 170 116, 250 120, 345 160" />
        <path className={STEM} {...STEM_PROPS} d="M237.7 72.5 C 246 52, 252 26, 248 -20" />
      </g>
    </svg>
  );
}

// Lighter tints for sitting behind text (abstract card): body text stays ~8.8:1.
const CORNER_FILLS = {
  green: "color-mix(in srgb, hsl(var(--accent)) 16%, hsl(var(--surface)))",
  khaki: "color-mix(in srgb, hsl(var(--gold)) 22%, hsl(var(--surface)))",
  grey: "color-mix(in srgb, hsl(var(--stone)) 18%, hsl(var(--surface)))",
};

/** Bottom-right corner piece for the abstract card. The parent needs
 *  `relative overflow-hidden isolate`; this sits behind the text (-z-10). */
export function MarkSliceCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 150"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
      className={cn(
        "absolute right-0 bottom-0 -z-10 h-[150px] w-[220px] max-sm:h-[102px] max-sm:w-[150px]",
        className,
      )}
    >
      <path
        style={{ fill: CORNER_FILLS.green }}
        d="M-6 174 L10 150 C 48 92, 128 34, 220 14 L252 9 L264 190 L-6 190 Z"
      />
      <path
        style={{ fill: CORNER_FILLS.khaki }}
        d="M84 178 C 110 124, 156 84, 262 58 L264 190 L84 190 Z"
      />
      <path
        style={{ fill: CORNER_FILLS.grey }}
        d="M84 178 C 94.4 156.4, 108 137, 127.4 119.9 C 152 116, 205 114, 264 130 L264 190 L84 190 Z"
      />
      {/* main stem; side branch forks at t = .4, twig at t = .7 */}
      <path className={STEM} {...STEM_PROPS} d="M84 178 C 110 124, 156 84, 262 58" />
      <path className={STEM} {...STEM_PROPS} d="M127.4 119.9 C 152 116, 205 114, 264 130" />
      <path className={STEM} {...STEM_PROPS} d="M181.7 85.2 C 188 66, 196 44, 192 -12" />
    </svg>
  );
}

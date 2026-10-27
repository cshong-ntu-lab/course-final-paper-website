// docs/design-v2.md §2.6 — the department crest (official file, original colours).
// In headers it links out to the department site; on the login page it stands
// alone above the heading.
import { cn } from "@/lib/utils";

const SRC = "/ntu-soc-crest.svg";
// viewBox 187 × 127
const RATIO = 127 / 187;

const SIZES = {
  sm: 30, // site / reader / workspace header
  lg: 74, // login page
} as const;

const DEPARTMENT_URL = "https://sociology.ntu.edu.tw/";

export function Crest({
  size = "sm",
  linked = false,
  className,
}: {
  size?: keyof typeof SIZES;
  /** Wrap in a link to the department site (new tab). */
  linked?: boolean;
  className?: string;
}) {
  const width = SIZES[size];
  const height = Math.round(width * RATIO);

  if (!linked) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={SRC}
        alt="臺灣大學社會學系系徽"
        width={width}
        height={height}
        className={cn("block flex-none", className)}
      />
    );
  }

  return (
    <a
      href={DEPARTMENT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="前往臺灣大學社會學系官網（新視窗）"
      title="前往臺灣大學社會學系官網"
      className={cn("flex flex-none rounded-md leading-none", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SRC} alt="" width={width} height={height} className="block" />
    </a>
  );
}

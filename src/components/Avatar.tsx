// docs/design-v2.md §2.1 — one avatar for the whole site, in four sizes.
// Photo when the user has one, otherwise the first character of the name on
// accent. The name is always printed next to it, so the image is decorative.
import { cn } from "@/lib/utils";

const SIZES = {
  sm: 28, // card / list / feature bylines, header account
  md: 40, // reader author card, editor preview
  lg: 80, // settings photo field
  xl: 120, // author page
} as const;

export type AvatarSize = keyof typeof SIZES;

export function Avatar({
  name,
  src,
  size = "sm",
  className,
}: {
  name: string;
  /** `User.avatarUrl`, falling back to `photoURLGoogle`. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const px = SIZES[size];
  const box = { width: px, height: px };

  if (src) {
    return (
      <span
        className={cn(
          "bg-canvas relative inline-block shrink-0 overflow-hidden rounded-full",
          // hairline ring above the photo so light photos don't melt into the page
          "after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_0_1px_rgba(28,29,26,0.12)] after:content-['']",
          className,
        )}
        style={box}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block size-full object-cover" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-accent text-accent-foreground inline-grid shrink-0 place-items-center rounded-full font-sans font-bold",
        className,
      )}
      style={{ ...box, fontSize: px * 0.38 }}
    >
      {(name || "？")[0]}
    </span>
  );
}

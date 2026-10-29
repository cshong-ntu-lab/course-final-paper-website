// Current-section detection for the reader's table of contents —
// docs/design-v2.md §2.5. Replaces an IntersectionObserver band, under which
// short final sections could never become "current".

/**
 * Index of the current heading, or -1 when there are none.
 *
 * The activation line sits at 30% of the viewport; within the last
 * viewport-height of scrolling it slides down to the viewport bottom, so every
 * heading — however short its section — crosses it in order.
 *
 * @param headingTops each heading's top relative to the viewport, in document order
 * @param viewportHeight `window.innerHeight`
 * @param remainingScroll `scrollHeight - innerHeight - scrollY`
 */
export function activeHeading(
  headingTops: number[],
  viewportHeight: number,
  remainingScroll: number,
): number {
  if (headingTops.length === 0) return -1;
  const line = Math.max(viewportHeight * 0.3, viewportHeight - remainingScroll - 8);
  let current = 0;
  headingTops.forEach((top, i) => {
    if (top <= line) current = i;
  });
  return current;
}

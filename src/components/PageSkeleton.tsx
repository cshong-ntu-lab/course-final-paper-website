// Minimal loading placeholder — visual polish deferred to Phase 11.5.
export function PageSkeleton() {
  return (
    <div className="bg-background min-h-screen" role="status" aria-label="載入中" aria-busy="true">
      <div className="border-border border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <div className="bg-canvas h-4 w-32 animate-pulse rounded" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-4">
        <div className="bg-canvas h-6 w-48 animate-pulse rounded" />
        <div className="bg-canvas h-4 w-full animate-pulse rounded" />
        <div className="bg-canvas h-4 w-3/4 animate-pulse rounded" />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="bg-background min-h-screen" role="status" aria-label="載入中" aria-busy="true">
      <div className="border-border border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-10">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

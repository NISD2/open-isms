import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="space-y-6">
      {/* Category header */}
      <div className="space-y-3 pb-6 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-7 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      {/* Requirement cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

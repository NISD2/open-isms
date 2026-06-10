import { Skeleton } from "@/components/ui/skeleton";

export default function RequirementDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-7 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* What */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* How */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Form */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

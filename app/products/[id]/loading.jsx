import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center gap-2 mb-6 md:mb-8">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Image skeleton */}
        <Skeleton className="aspect-square md:aspect-[4/3] rounded-xl" />

        {/* Info skeleton */}
        <div className="flex flex-col gap-4 md:gap-5">
          <div className="space-y-3">
            <Skeleton className="h-8 md:h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <Skeleton className="h-10 w-32" />

          <div className="flex gap-3 pt-1">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>

          <div className="space-y-3 mt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

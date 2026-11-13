type PageSkeletonProps = {
  variant?: 'dashboard' | 'list' | 'form' | 'billing';
};

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/60 ${className}`} />
);

export function PageSkeleton({ variant = 'dashboard' }: PageSkeletonProps) {
  return (
    <div className="w-full space-y-6 p-1" role="status" aria-label="Loading page">
      {variant === 'dashboard' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <SkeletonBlock className="h-4 w-2/5" />
              <SkeletonBlock className="h-7 w-1/3" />
            </div>
          ))}
        </div>
      )}
      {variant === 'list' && (
        <div className="space-y-4">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-11 w-full" />
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      )}
      {variant === 'form' && (
        <div className="max-w-3xl space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <SkeletonBlock className="h-8 w-1/3" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock className="h-4 w-1/4" />
              <SkeletonBlock className="h-11 w-full" />
            </div>
          ))}
        </div>
      )}
      {variant === 'billing' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Loading subscription plans">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex min-h-[390px] flex-col space-y-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 md:p-8">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-5 w-1/3" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </div>
              </div>
              <SkeletonBlock className="h-10 w-2/3" />
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-3/4" />
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="h-5 w-4/5" />
              </div>
              <SkeletonBlock className="mt-auto h-12 w-full rounded-xl" />
              <div className="flex flex-col items-center gap-2 border-t border-slate-200 pt-5 dark:border-slate-700">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-8 w-[84px]" />
              </div>
            </div>
          ))}
        </div>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}

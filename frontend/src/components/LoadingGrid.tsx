export function LoadingGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact ? 'w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm' : 'w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)]'}
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className={[
              'h-12 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
              'animate-pulse',
              compact ? 'h-10' : 'h-14'
            ].join(' ')}
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

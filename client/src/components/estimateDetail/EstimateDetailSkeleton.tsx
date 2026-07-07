function Bar({ width, height = 14 }: { width: string | number; height?: number }) {
  return <div className="animate-pulse bg-neutral-100" style={{ width, height }} />;
}

/** Matches prototype/project/prototype/Estimate-Loading.html. */
export function EstimateDetailSkeleton() {
  return (
    <div aria-busy="true">
      <div className="flex items-start justify-between gap-6 border-b border-[var(--border-hairline)] pb-7">
        <div>
          <Bar width={150} height={13} />
          <div className="mt-4">
            <Bar width={340} height={38} />
          </div>
        </div>
        <div className="h-[22px] w-16 animate-pulse bg-neutral-100" />
      </div>

      <div className="mt-10">
        <div className="mb-5">
          <Bar width={90} height={12} />
        </div>
        {[68, 58, 74, 62].map((w, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-[18px] ${i === 3 ? '' : 'border-b border-[var(--border-hairline)]'}`}
          >
            <Bar width={`${w}%`} height={16} />
            <Bar width={72} height={16} />
          </div>
        ))}
      </div>

      <div className="ml-auto mt-10 max-w-[380px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-[11px]">
            <Bar width={110} height={14} />
            <Bar width={70} height={14} />
          </div>
        ))}
        <div className="mt-[10px] flex items-center justify-between border-t border-[var(--border-strong)] pt-5">
          <Bar width={80} height={14} />
          <Bar width={110} height={28} />
        </div>
      </div>

      <div className="mt-12 flex items-center gap-3 border-t border-[var(--border-hairline)] pt-7">
        <div className="h-[44px] w-[108px] animate-pulse bg-neutral-100" />
        <div className="h-[44px] w-[168px] animate-pulse bg-neutral-100" />
        <div className="flex-1" />
        <div className="h-[44px] w-[168px] animate-pulse bg-neutral-100" />
      </div>
    </div>
  );
}

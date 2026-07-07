/**
 * Loading skeleton (the group/card placeholders only), matching
 * prototype/project/prototype/Dashboard-Loading.html. The header and the "Estimates"
 * section-label row are rendered by DashboardView for every state, so they never
 * flicker between states — this component only owns the parts that differ.
 */

function SkeletonBar({ width, height = 14 }: { width: string; height?: number }) {
  return <div className="animate-pulse bg-neutral-100" style={{ width, height }} />;
}

function CardSkeleton() {
  return (
    <div className="flex min-h-[132px] flex-col justify-between border border-[var(--border-hairline)] bg-white p-[22px]">
      <div className="flex flex-col gap-[10px]">
        <SkeletonBar width="78%" height={16} />
        <SkeletonBar width="52%" height={16} />
      </div>
      <SkeletonBar width="64px" height={22} />
    </div>
  );
}

function GroupSkeleton({ count }: { count: number }) {
  return (
    <section className="mb-[44px]">
      <div className="mb-[18px] flex items-center gap-3">
        <SkeletonBar width="190px" height={22} />
        <div className="h-[30px] w-[30px] animate-pulse border border-[var(--border-strong)] bg-neutral-50" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(258px,1fr))] gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <GroupSkeleton count={3} />
      <GroupSkeleton count={2} />
      <GroupSkeleton count={1} />
    </div>
  );
}

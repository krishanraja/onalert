import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-muted',
        className
      )}
    />
  )
}

export function MonitorCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-40 mb-1.5" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <div className="pt-2 border-t border-border">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

export function AlertCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-4 w-8 rounded" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-12 shrink-0" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Quick stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-3">
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-6 w-8 mb-1" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
      {/* Monitor cards skeleton */}
      <MonitorCardSkeleton />
      <MonitorCardSkeleton />
    </div>
  )
}

export function AlertsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <AlertCardSkeleton key={i} />
      ))}
    </div>
  )
}

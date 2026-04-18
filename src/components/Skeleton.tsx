import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse bg-white/5 rounded-lg overflow-hidden relative", className)}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
  </div>
);

export const ProjectSkeleton = () => (
  <div className="aspect-[4/5] bg-white/5 rounded-2xl p-px overflow-hidden">
    <div className="w-full h-full bg-brand-bg rounded-[15px] p-8 flex flex-col justify-end gap-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
);

export const LabSkeleton = () => (
  <div className="aspect-video bg-white/5 rounded-2xl p-8 flex flex-col justify-end gap-4">
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-6 w-3/4" />
  </div>
);

export const VideoSkeleton = () => (
  <div className="aspect-video bg-white/5 rounded-2xl p-4 flex flex-col justify-end gap-4">
    <Skeleton className="h-8 w-8 rounded-full mb-auto" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

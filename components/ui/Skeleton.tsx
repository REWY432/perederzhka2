import React from 'react';
import { cn } from '../../utils/helpers';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse bg-slate-200 dark:bg-slate-700 rounded',
      className
    )}
  />
);

export const BookingCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="space-y-2 flex-1">
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
      <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="flex gap-8 mb-4">
      <div className="space-y-1">
        <div className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="space-y-1">
        <div className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800">
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
      <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 space-y-8 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="w-40 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
    </div>

    {/* Hero Button */}
    <div className="w-full h-16 bg-slate-200 dark:bg-slate-700 rounded-3xl" />

    {/* Stats Cards */}
    <div className="grid grid-cols-2 gap-4">
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
    </div>

    {/* Revenue Card */}
    <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl" />

    {/* Calendar */}
    <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="w-24 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="space-y-4">
          <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export const ReportsSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <div className="w-48 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="w-64 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-16 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-2 gap-4">
      <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
);

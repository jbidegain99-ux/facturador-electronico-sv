"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skeleton = Skeleton;
exports.SkeletonCard = SkeletonCard;
exports.SkeletonTable = SkeletonTable;
exports.SkeletonChart = SkeletonChart;
exports.SkeletonList = SkeletonList;
exports.SkeletonForm = SkeletonForm;
const utils_1 = require("@/lib/utils");
function Skeleton({ className, style }) {
    return (<div className={(0, utils_1.cn)('animate-pulse rounded-md bg-muted/50', className)} style={style}/>);
}
// Pre-built skeleton components for common patterns
function SkeletonCard({ className }) {
    return (<div className={(0, utils_1.cn)('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24"/>
        <Skeleton className="h-4 w-4 rounded-full"/>
      </div>
      <Skeleton className="h-8 w-20"/>
      <Skeleton className="h-3 w-32"/>
    </div>);
}
function SkeletonTable({ rows = 5 }) {
    return (<div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        <Skeleton className="h-4 w-20"/>
        <Skeleton className="h-4 w-32"/>
        <Skeleton className="h-4 w-24"/>
        <Skeleton className="h-4 w-20"/>
        <Skeleton className="h-4 w-16 ml-auto"/>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (<div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-20"/>
          <Skeleton className="h-4 w-32"/>
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-4 w-20"/>
          <Skeleton className="h-6 w-16 ml-auto"/>
        </div>))}
    </div>);
}
function SkeletonChart() {
    return (<div className="rounded-lg border bg-card p-6">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-5 w-40"/>
        <Skeleton className="h-3 w-60"/>
      </div>
      <div className="flex items-end justify-between h-48 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (<div key={i} className="flex flex-col items-center flex-1">
            <Skeleton className="w-full rounded-t" style={{ height: `${Math.random() * 120 + 40}px` }}/>
            <Skeleton className="h-3 w-8 mt-2"/>
          </div>))}
      </div>
    </div>);
}
function SkeletonList({ items = 5 }) {
    return (<div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (<div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full"/>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4"/>
            <Skeleton className="h-3 w-1/2"/>
          </div>
          <Skeleton className="h-4 w-20"/>
        </div>))}
    </div>);
}
function SkeletonForm() {
    return (<div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-10 w-full"/>
        </div>))}
      <Skeleton className="h-10 w-32"/>
    </div>);
}

import React from 'react'

export default function Skeleton() {
  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 animate-pulse space-y-8 mb-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2.5 flex-1 max-w-sm">
          <div className="h-7 bg-white/10 rounded-lg w-3/4"></div>
          <div className="h-3 bg-white/5 rounded w-1/2"></div>
        </div>
        <div className="h-7 bg-white/10 rounded-full w-40"></div>
      </div>

      {/* Speech Audio bar skeleton */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4 bg-navy-900/40">
        <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-white/10 rounded-lg w-1/3"></div>
          <div className="h-3 bg-white/5 rounded-lg w-2/3"></div>
        </div>
      </div>

      {/* Parameter grids skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="glass-panel p-4 rounded-2xl border border-white/5 space-y-2 bg-navy-900/20">
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4 font-semibold"></div>
          </div>
        ))}
      </div>

      {/* Main content markdown body skeleton */}
      <div className="space-y-4 bg-[#020810]/40 p-6 rounded-2xl border border-white/5 shadow-inner">
        <div className="h-5 bg-white/15 rounded-lg w-1/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3.5 bg-white/10 rounded w-full"></div>
          <div className="h-3.5 bg-white/10 rounded w-11/12"></div>
          <div className="h-3.5 bg-white/10 rounded w-4/5"></div>
        </div>
        
        <div className="h-5 bg-white/15 rounded-lg w-1/3 mt-6 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3.5 bg-white/10 rounded w-full"></div>
          <div className="h-3.5 bg-white/10 rounded w-5/6"></div>
        </div>
      </div>

      {/* Disclaimer skeleton */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
        <div className="h-3 bg-white/10 rounded w-1/4"></div>
        <div className="h-3 bg-white/5 rounded w-full"></div>
        <div className="h-3 bg-white/5 rounded w-5/6"></div>
      </div>
    </div>
  )
}

import React from 'react';

const MatchCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-5 px-5 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pl-2">
        <div className="flex items-center gap-6 md:gap-10 flex-1">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0 flex flex-col items-center md:items-start">
             <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
             <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Teams Column */}
          <div className="flex flex-col gap-3 min-w-[220px] flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCardSkeleton;

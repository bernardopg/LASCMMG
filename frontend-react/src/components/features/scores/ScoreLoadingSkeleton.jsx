const ModernLoadingSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-700 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-5 bg-slate-600 rounded-xl w-24" />
                <div className="h-4 bg-slate-700 rounded-lg w-32" />
              </div>
            </div>
            <div className="h-8 bg-slate-600 rounded-xl w-20" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/70 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-600 rounded-xl" />
                <div className="h-5 bg-slate-700 rounded-xl w-20" />
              </div>
              <div className="h-8 bg-slate-600 rounded-lg w-8" />
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/70 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-600 rounded-xl" />
                <div className="h-5 bg-slate-700 rounded-xl w-20" />
              </div>
              <div className="h-8 bg-slate-600 rounded-lg w-8" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ModernLoadingSkeleton;

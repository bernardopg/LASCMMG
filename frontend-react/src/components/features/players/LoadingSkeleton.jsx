import { FaGamepad } from 'react-icons/fa';

const LoadingSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-green-800/30 backdrop-blur-md border border-green-700/40 rounded-3xl p-8 shadow-xl"
      >
        <div className="animate-pulse space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-16 h-16 bg-green-700/50 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-green-700/50 rounded-xl w-3/4" />
                <div className="h-4 bg-green-600/40 rounded-lg w-full" />
                <div className="h-4 bg-lime-600/40 rounded-full w-20" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 bg-green-700/50 rounded-xl" />
              <div className="w-12 h-12 bg-green-700/50 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, idx) => (
              <div key={idx} className="text-center space-y-2">
                <div className="w-10 h-10 bg-green-700/50 rounded-xl mx-auto" />
                <div className="h-4 bg-green-600/40 rounded-lg" />
                <div className="h-3 bg-green-600/40 rounded-lg w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;

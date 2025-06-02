/**
 * Loading Skeleton Component para carregamento de conteúdo
 */
const LoadingSkeleton = ({ width = 'w-full', height = 'h-6', className = '' }) => {
  return <div className={`animate-pulse bg-slate-200 rounded ${width} ${height} ${className}`} />;
};

export default LoadingSkeleton;

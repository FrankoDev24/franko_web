// Text-free placeholder shared by route and deferred-module boundaries.
export default function PendingPlaceholder({ compact = false }) {
  return <div role="status" aria-label="Please wait" aria-busy="true"
    className={`animate-pulse mx-auto w-full max-w-7xl ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
    <div className="h-5 w-1/3 rounded bg-gray-100 mb-4" />
    <div className={`rounded-xl bg-gray-100 ${compact ? 'h-20' : 'h-64'}`} />
  </div>;
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`}
    />
  )
}

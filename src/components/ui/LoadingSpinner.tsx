export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  )
}

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastState } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const COLORS = {
  success: 'text-success border-success/20 bg-success-muted',
  error: 'text-destructive border-destructive/20 bg-destructive-muted',
  info: 'text-foreground-secondary border-border bg-surface',
}

export function Toaster() {
  const { toasts, removeToast } = useToastState()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-height)+var(--safe-area-bottom)+0.5rem)] lg:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-2',
              COLORS[toast.type]
            )}
          >
            <Icon size={16} className="shrink-0" />
            <p className="text-sm flex-1 text-foreground">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-foreground-muted hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

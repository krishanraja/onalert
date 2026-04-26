import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  /** When provided, shows a back button. Pass `-1` style via custom onBack, otherwise uses navigate(to). */
  onBack?: () => void
  /** Convenience: navigate to a specific path on back. Ignored if `onBack` is set. */
  backTo?: string
  /** Optional right slot for actions/badges. */
  right?: ReactNode
  /** Optional second line of header content (e.g. tabs). Renders below the title row. */
  belowTitle?: ReactNode
  /** Constrain inner content to a max width (mirrors per-page chrome). */
  maxWidthClassName?: string
  className?: string
}

/**
 * Standard sticky page chrome shared across landing/locations/wait-times/etc.
 * Encapsulates the repeated `sticky top-0 z-10 bg-background-elevated
 * border-b border-border px-4 py-3` pattern so headers stay aligned and
 * future style changes (e.g. safe-area handling, height) only need to touch
 * one file.
 */
export function PageHeader({
  title,
  onBack,
  backTo,
  right,
  belowTitle,
  maxWidthClassName,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (backTo ? () => navigate(backTo) : undefined)

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] bg-background-elevated border-b border-border px-4 py-3',
        className,
      )}
    >
      <div className={cn('flex items-center gap-3', maxWidthClassName ?? 'max-w-3xl mx-auto')}>
        {handleBack && (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="p-1 text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground flex-1 min-w-0 truncate">{title}</h1>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {belowTitle}
    </header>
  )
}

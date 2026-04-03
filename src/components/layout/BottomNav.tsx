import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Bell, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/haptics'

interface Props {
  unreadCount?: number
}

export function BottomNav({ unreadCount = 0 }: Props) {
  const navigate = useNavigate()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 bg-background-elevated border-t border-border z-50 lg:hidden"
      style={{ height: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom))', paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div className="flex items-center justify-around h-[var(--bottom-nav-height)] px-2">
        <NavLink to="/app" end aria-label="Home" className={({ isActive }) => cn(
          'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px]',
          isActive ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary'
        )}>
          <Home size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink to="/app/alerts" aria-label={unreadCount > 0 ? `Alerts (${unreadCount} unread)` : 'Alerts'} className={({ isActive }) => cn(
          'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px] relative',
          isActive ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary'
        )}>
          <div className="relative">
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </NavLink>

        <button
          onClick={() => {
            haptic('navigation')
            navigate('/app/add')
          }}
          aria-label="Add new monitor"
          className="flex flex-col items-center gap-1 px-2 py-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <Plus size={24} className="text-white" strokeWidth={2.5} />
          </div>
        </button>

        <NavLink to="/app/settings" aria-label="Settings" className={({ isActive }) => cn(
          'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px]',
          isActive ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary'
        )}>
          <Settings size={22} />
          <span className="text-[10px] font-medium">Settings</span>
        </NavLink>
      </div>
    </nav>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Bell, Plus, Settings, Crown, Users, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'

interface Props {
  unreadCount?: number
}

export function Sidebar({ unreadCount = 0 }: Props) {
  const navigate = useNavigate()
  const { isPaid, isFamily } = useProfile()

  const navItems = [
    { to: '/app', end: true, icon: Home, label: 'Dashboard', shortcut: '1' },
    { to: '/app/alerts', end: false, icon: Bell, label: 'Alerts', shortcut: '2', badge: unreadCount },
    { to: '/app/settings', end: false, icon: Settings, label: 'Settings', shortcut: '4' },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-background-elevated h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src="/brand/icon-light.svg"
            alt="OnAlert"
            className="h-9 w-9"
          />
          <span className="font-semibold text-foreground text-lg">OnAlert</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium group',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-muted'
            )}
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <span className="text-[10px] text-foreground-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              {item.shortcut}
            </span>
          </NavLink>
        ))}

        {/* Add Monitor button */}
        <button
          onClick={() => navigate('/app/add')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium bg-primary text-white hover:bg-primary/90 mt-3"
        >
          <Plus size={18} />
          <span>Add Monitor</span>
          <span className="text-[10px] font-mono opacity-70 ml-auto">N</span>
        </button>
      </nav>

      {/* Plan badge & shortcuts hint */}
      <div className="px-3 py-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2 px-3">
          {isPaid ? (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full">
              {isFamily ? <Users size={11} /> : <Crown size={11} />}
              <span className="text-[10px] font-medium">{isFamily ? 'FAMILY' : 'PRO'}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/app/settings', { state: { scrollToUpgrade: true } })}
              className="flex items-center gap-1.5 bg-surface text-foreground-muted px-2 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <Crown size={10} />
              <span className="text-[10px] font-medium">FREE</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 text-foreground-muted">
          <Keyboard size={12} />
          <span className="text-[10px]">Press <kbd className="font-mono bg-surface px-1 rounded">?</kbd> for shortcuts</span>
        </div>
      </div>
    </aside>
  )
}

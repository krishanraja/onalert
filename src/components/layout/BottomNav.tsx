import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Bell, Plus, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
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
      className="shrink-0 bg-background-elevated/95 backdrop-blur-md border-t border-border lg:hidden"
      style={{ height: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom))', paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div className="flex items-center justify-around h-[var(--bottom-nav-height)] px-2">
        {/* Home tab */}
        <NavLink
          to="/app"
          end
          aria-label="Home"
          onClick={() => haptic('navigation')}
          className={({ isActive }) => cn(
            'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px] relative',
            isActive ? 'text-primary' : 'text-foreground-muted'
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-[1px] left-3 right-3 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div animate={isActive ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.2 }}>
                <Home size={22} />
              </motion.div>
              <span className="text-[10px] font-medium">Home</span>
            </>
          )}
        </NavLink>

        {/* Alerts tab */}
        <NavLink
          to="/app/alerts"
          aria-label={unreadCount > 0 ? `Alerts (${unreadCount} unread)` : 'Alerts'}
          onClick={() => haptic('navigation')}
          className={({ isActive }) => cn(
            'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px] relative',
            isActive ? 'text-primary' : 'text-foreground-muted'
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-[1px] left-3 right-3 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div animate={isActive ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.2 }} className="relative">
                <Bell size={22} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.div>
              <span className="text-[10px] font-medium">Alerts</span>
            </>
          )}
        </NavLink>

        {/* Add Monitor FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
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
        </motion.button>

        {/* Settings tab */}
        <NavLink
          to="/app/settings"
          aria-label="Settings"
          onClick={() => haptic('navigation')}
          className={({ isActive }) => cn(
            'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px] relative',
            isActive ? 'text-primary' : 'text-foreground-muted'
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-[1px] left-3 right-3 h-[2px] bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div animate={isActive ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.2 }}>
                <Settings size={22} />
              </motion.div>
              <span className="text-[10px] font-medium">Settings</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const isCmd = e.metaKey || e.ctrlKey

      // Cmd/Ctrl + N → Add monitor
      if (isCmd && e.key === 'n') {
        e.preventDefault()
        navigate('/app/add')
        return
      }

      // Single key shortcuts (no modifier)
      if (!isCmd && !e.altKey) {
        switch (e.key) {
          case '1':
            navigate('/app')
            break
          case '2':
            navigate('/app/alerts')
            break
          case '4':
            navigate('/app/settings')
            break
          case '?':
            setShowHelp((prev) => !prev)
            break
          case 'Escape':
            setShowHelp(false)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return { showHelp, setShowHelp }
}

export const SHORTCUTS = [
  { keys: ['1'], description: 'Go to Dashboard' },
  { keys: ['2'], description: 'Go to Alerts' },
  { keys: ['4'], description: 'Go to Settings' },
  { keys: ['Cmd', 'N'], description: 'Add new monitor' },
  { keys: ['?'], description: 'Toggle shortcuts help' },
  { keys: ['Esc'], description: 'Close / Go back' },
]

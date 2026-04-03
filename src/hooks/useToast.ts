import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

let toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const toast: Toast = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    message,
    type,
    duration,
  }
  toastListeners.forEach((listener) => listener(toast))
}

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast])
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Register listener
  useState(() => {
    toastListeners.push(addToast)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast)
    }
  })

  return { toasts, removeToast }
}

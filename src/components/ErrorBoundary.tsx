import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center font-sans">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-foreground-muted mb-6">
              The application encountered an unexpected error.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white border-0 px-6 py-2.5 rounded-lg cursor-pointer text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

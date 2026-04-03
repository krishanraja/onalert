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
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <h1 style={{ color: '#F5F5F5', fontSize: 24, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ color: '#888888', fontSize: 14, marginBottom: 24 }}>
              The application encountered an unexpected error.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#9F0506',
                color: '#F5F5F5',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
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

'use client'

import React, { ReactNode, Component, ErrorInfo } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-destructive" />
                <h1 className="font-semibold text-lg">Something went wrong</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={this.reset} variant="default" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/app/dashboard'} variant="outline" className="flex-1">
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

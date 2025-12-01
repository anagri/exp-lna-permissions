import { Component, type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { XCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.log('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <XCircle className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Something went wrong</h2>
              </div>
              <p className="text-gray-600 mb-4">
                An unexpected error occurred. Please refresh the page.
              </p>
              {this.state.error && (
                <pre className="bg-red-50 border border-red-200 rounded p-4 text-sm overflow-x-auto">
                  {this.state.error.message}
                </pre>
              )}
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

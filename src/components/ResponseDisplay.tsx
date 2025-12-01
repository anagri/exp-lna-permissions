import type { FetchResponse } from '@/types/lna'
import { Card } from '@/components/ui/Card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ResponseDisplayProps {
  response: FetchResponse
}

export function ResponseDisplay({ response }: ResponseDisplayProps) {
  if (response.status === 'idle') {
    return null
  }

  return (
    <Card data-testid="response-display">
      <h2 className="text-xl font-semibold mb-4">Response</h2>

      {response.status === 'loading' && (
        <div className="flex items-center gap-2 text-gray-600" data-testid="response-loading">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Sending request...</span>
        </div>
      )}

      {response.status === 'error' && (
        <div data-testid="response-error">
          <div className="flex items-center gap-2 text-red-600 mb-3">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold">Error</span>
          </div>
          <pre className="bg-red-50 border border-red-200 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words">
            {response.error}
          </pre>
        </div>
      )}

      {response.status === 'success' && (
        <div data-testid="response-success">
          <div className="flex items-center gap-2 text-green-600 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Success</span>
          </div>

          {response.headers && Object.keys(response.headers).length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">LNA-Related Headers:</h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-1">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="text-sm font-mono">
                    <span className="text-blue-600">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-2">Response Data:</h3>
            <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm overflow-x-auto">
              {typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Card>
  )
}

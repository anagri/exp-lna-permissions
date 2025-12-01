import type { LNAPermissionStatus } from '@/types/lna'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PermissionStatusProps {
  status: LNAPermissionStatus | null
  isLoading: boolean
  onRefresh: () => void
}

export function PermissionStatus({ status, isLoading, onRefresh }: PermissionStatusProps) {
  if (isLoading) {
    return (
      <Card data-testid="permission-status-loading">
        <h2 className="text-xl font-semibold mb-4">Permission Status</h2>
        <p className="text-gray-600">Checking permission...</p>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card data-testid="permission-status-error">
        <h2 className="text-xl font-semibold mb-4">Permission Status</h2>
        <p className="text-red-600">Failed to check permission status</p>
      </Card>
    )
  }

  const { state, isSecureContext, browserSupport } = status

  const getStateIcon = () => {
    switch (state) {
      case 'granted':
        return <CheckCircle className="text-green-600" />
      case 'denied':
        return <XCircle className="text-red-600" />
      case 'prompt':
        return <AlertCircle className="text-yellow-600" />
    }
  }

  const getStateColor = () => {
    switch (state) {
      case 'granted':
        return 'text-green-600'
      case 'denied':
        return 'text-red-600'
      case 'prompt':
        return 'text-yellow-600'
    }
  }

  return (
    <Card data-testid="permission-status">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Permission Status</h2>
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isLoading}
          data-testid="refresh-permission-button"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getStateIcon()}
          <span className="font-medium">State:</span>
          <span
            className={cn('font-bold uppercase', getStateColor())}
            data-testid="permission-state"
          >
            {state}
          </span>
        </div>

        <div>
          <span className="font-medium">Secure Context (HTTPS): </span>
          <span
            className={isSecureContext ? 'text-green-600' : 'text-red-600'}
            data-testid="secure-context"
          >
            {isSecureContext ? 'Yes' : 'No'}
          </span>
          {!isSecureContext && (
            <p className="text-sm text-gray-600 mt-1">
              LNA requires HTTPS. Use localhost or deploy to HTTPS server.
            </p>
          )}
        </div>

        <div>
          <span className="font-medium">API Support: </span>
          <span
            className={browserSupport.isSupported ? 'text-green-600' : 'text-orange-600'}
            data-testid="browser-support"
          >
            {browserSupport.isSupported ? 'Detected' : 'Not Detected'}
          </span>
          {browserSupport.reason && (
            <p className="text-sm text-gray-600 mt-1" data-testid="support-reason">
              {browserSupport.reason}
            </p>
          )}
        </div>

        {browserSupport.browserInfo && (
          <div>
            <span className="font-medium">Browser: </span>
            <span data-testid="browser-info">
              {browserSupport.browserInfo.name} {browserSupport.browserInfo.version}
            </span>
            {browserSupport.browserInfo.supportReason && (
              <p
                className={cn(
                  'text-sm mt-1',
                  browserSupport.browserInfo.isLikelySupported
                    ? 'text-green-600'
                    : 'text-orange-600'
                )}
                data-testid="browser-support-reason"
              >
                {browserSupport.browserInfo.supportReason}
              </p>
            )}
          </div>
        )}

        {!browserSupport.isSupported && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> LNA API not detected, but you can still try making requests.
              The browser may support it despite detection failing.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

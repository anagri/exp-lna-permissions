import { useLNAPermission } from '@/hooks/useLNAPermission'
import { useLNAFetch } from '@/hooks/useLNAFetch'
import { PermissionStatus } from '@/components/PermissionStatus'
import { RequestForm } from '@/components/RequestForm'
import { ResponseDisplay } from '@/components/ResponseDisplay'

export default function Home() {
  const { permissionStatus, isLoading, refresh } = useLNAPermission()
  const { response, sendRequest, clear } = useLNAFetch()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">LNA Permissions Explorer</h1>
          <p className="text-lg text-gray-600">
            Test Local Network Access (LNA) permissions across different browsers and permission
            states.
          </p>
        </header>

        <PermissionStatus status={permissionStatus} isLoading={isLoading} onRefresh={refresh} />

        <RequestForm
          onSubmit={sendRequest}
          onClear={clear}
          isLoading={response.status === 'loading'}
          hasResponse={response.status !== 'idle'}
        />

        <ResponseDisplay response={response} />

        <footer className="mt-12 pt-6 border-t border-gray-200">
          <h3 className="font-semibold mb-2">Testing Notes:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>LNA requires HTTPS (secure context) - use localhost or deploy to HTTPS server</li>
            <li>Chrome 142+ and Edge 143+ support LNA (late 2025)</li>
            <li>
              Server must respond with CORS header: Access-Control-Allow-Private-Network: true
            </li>
            <li>Test different permission states: granted, prompt, denied</li>
            <li>Try both &apos;local&apos; and &apos;private&apos; target address spaces</li>
            <li>Even if browser is unsupported, you can still try making requests</li>
          </ul>
        </footer>
      </div>
    </div>
  )
}

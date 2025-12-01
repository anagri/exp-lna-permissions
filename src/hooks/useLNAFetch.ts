import { useState, useCallback } from 'react'
import type { FetchResponse, TargetAddressSpace } from '@/types/lna'
import { makeLocalNetworkRequest } from '@/lib/lna-permissions'

export function useLNAFetch() {
  const [response, setResponse] = useState<FetchResponse>({ status: 'idle' })

  const sendRequest = useCallback(
    async (url: string, targetAddressSpace: TargetAddressSpace = 'local') => {
      setResponse({ status: 'loading' })

      try {
        const { data, headers } = await makeLocalNetworkRequest(url, targetAddressSpace)
        setResponse({
          status: 'success',
          data,
          headers,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.log('Fetch error:', errorMessage, error)
        setResponse({
          status: 'error',
          error: errorMessage,
        })
      }
    },
    []
  )

  const clear = useCallback(() => {
    setResponse({ status: 'idle' })
  }, [])

  return { response, sendRequest, clear }
}

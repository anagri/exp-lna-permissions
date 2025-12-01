import type { LNAPermissionStatus, BrowserSupport } from '@/types/lna'
import { getBrowserInfo } from './browser-detection'

export async function queryLNAPermission(): Promise<LNAPermissionStatus> {
  const browserInfo = getBrowserInfo()
  const isSecureContext = window.isSecureContext

  const browserSupport: BrowserSupport = {
    isSupported: true,
    browserInfo,
  }

  if (!isSecureContext) {
    browserSupport.reason = 'HTTPS required (not in secure context)'
  }

  if (!navigator.permissions || !navigator.permissions.query) {
    browserSupport.isSupported = false
    browserSupport.reason = 'Permissions API not available'
    return {
      state: 'denied',
      isSecureContext,
      browserSupport,
    }
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'local-network-access' as PermissionName,
    })

    return {
      state: permissionStatus.state as 'granted' | 'prompt' | 'denied',
      isSecureContext,
      browserSupport,
    }
  } catch (error) {
    browserSupport.isSupported = false
    browserSupport.reason = 'local-network-access permission not recognized by browser'
    console.log('LNA permission query error:', error)
    return {
      state: 'denied',
      isSecureContext,
      browserSupport,
    }
  }
}

export async function makeLocalNetworkRequest(
  url: string,
  targetAddressSpace: 'local' | 'private' = 'local'
): Promise<{ data: unknown; headers: Record<string, string> }> {
  const response = await fetch(url, {
    method: 'GET',
    // @ts-expect-error - targetAddressSpace is experimental
    targetAddressSpace,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    if (
      key.toLowerCase().includes('private-network') ||
      key.toLowerCase().includes('access-control')
    ) {
      headers[key] = value
    }
  })

  const contentType = response.headers.get('content-type')
  let data: unknown

  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  return { data, headers }
}

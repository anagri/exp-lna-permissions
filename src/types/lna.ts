export type PermissionState = 'granted' | 'prompt' | 'denied'

export type BrowserInfo = {
  name: string
  version: string
  isLikelySupported: boolean
  supportReason?: string
}

export type BrowserSupport = {
  isSupported: boolean
  reason?: string
  browserInfo?: BrowserInfo
}

export type LNAPermissionStatus = {
  state: PermissionState
  isSecureContext: boolean
  browserSupport: BrowserSupport
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export type TargetAddressSpace = 'local' | 'private' | 'none'

export type FetchResponse = {
  status: RequestStatus
  data?: unknown
  error?: string
  headers?: Record<string, string>
}

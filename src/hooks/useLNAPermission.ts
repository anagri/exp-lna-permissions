import { useState, useEffect, useCallback } from 'react'
import type { LNAPermissionStatus } from '@/types/lna'
import { queryLNAPermission } from '@/lib/lna-permissions'

export function useLNAPermission() {
  const [permissionStatus, setPermissionStatus] = useState<LNAPermissionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = await queryLNAPermission()
      setPermissionStatus(status)
    } catch (error) {
      console.log('Error querying LNA permission:', error)
      setPermissionStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { permissionStatus, isLoading, refresh }
}

import { UAParser } from 'ua-parser-js'
import type { BrowserInfo } from '@/types/lna'

export function getBrowserInfo(): BrowserInfo {
  const parser = new UAParser()
  const browser = parser.getBrowser()
  const browserName = browser.name || 'Unknown'
  const browserVersion = browser.version || '0'

  const { isLikelySupported, supportReason } = checkLikelySupport(browserName, browserVersion)

  return {
    name: browserName,
    version: browserVersion,
    isLikelySupported,
    supportReason,
  }
}

function checkLikelySupport(
  browserName: string,
  browserVersion: string
): { isLikelySupported: boolean; supportReason?: string } {
  const versionNumber = parseInt(browserVersion, 10)

  if (browserName.includes('Chrome') || browserName.includes('Chromium')) {
    if (versionNumber >= 142) {
      return {
        isLikelySupported: true,
        supportReason: `Chrome ${versionNumber}+ supports LNA`,
      }
    }
    return {
      isLikelySupported: false,
      supportReason: `Chrome ${versionNumber} detected. LNA requires Chrome 142+`,
    }
  }

  if (browserName.includes('Edge') || browserName.includes('Edg')) {
    if (versionNumber >= 143) {
      return {
        isLikelySupported: true,
        supportReason: `Edge ${versionNumber}+ supports LNA`,
      }
    }
    return {
      isLikelySupported: false,
      supportReason: `Edge ${versionNumber} detected. LNA requires Edge 143+`,
    }
  }

  if (browserName.includes('Firefox')) {
    return {
      isLikelySupported: false,
      supportReason: 'Firefox support is in prototyping stage',
    }
  }

  if (browserName.includes('Safari')) {
    return {
      isLikelySupported: false,
      supportReason: 'Safari does not support LNA',
    }
  }

  return {
    isLikelySupported: false,
    supportReason: `${browserName} support unknown. Try Chrome 142+ or Edge 143+`,
  }
}

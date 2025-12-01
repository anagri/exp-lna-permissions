# Local Network Access (LNA) - Comprehensive Guide

## Overview

Local Network Access (LNA), also known as Private Network Access (PNA), is a browser security feature that requires explicit user permission before websites can access devices on local/private networks.

**Purpose:** Protect users from CSRF attacks, network fingerprinting, and unauthorized access to local devices (routers, IoT devices, printers) from malicious websites.

## Browser Support

### Chromium-Based Browsers

**Chrome:**
- **Chrome 142+** (October 28, 2025): Permission prompt enabled by default
- **Chrome 138-141**: Available via flag `chrome://flags/#local-network-access-check`
- **Chrome 98+**: Preflight requests introduced (warning mode)

**Microsoft Edge:**
- **Edge 143+** (December 1-7, 2025): Permission prompt enabled
- **Edge 140+**: Enterprise policies available
- Policies: `LocalNetworkAccessAllowedForUrls`, `LocalNetworkAccessBlockedForUrls`

### Other Browsers

**Firefox:**
- Status: Prototyping/development
- Tracking: [Bugzilla #1481298](https://bugzilla.mozilla.org/show_bug.cgi?id=1481298)
- Timeline: Not announced

**Safari:**
- Status: Not supported for web
- macOS/iOS: OS-level permissions for native apps only

## Core Concepts

### Address Spaces

LNA categorizes network addresses into three types:

1. **Local (Loopback)**
   - `localhost`, `127.0.0.1`, `::1`
   - Same-device communication

2. **Private**
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
   - RFC1918 private networks

3. **Public**
   - All other addresses
   - Internet-routable IPs

### Permission States

- **`granted`**: User allowed access, requests proceed without prompts
- **`prompt`**: User not asked yet, first request triggers permission dialog
- **`denied`**: User blocked access, requests fail

## JavaScript APIs

### Permission Query

```typescript
// Check current permission status
const permissionStatus = await navigator.permissions.query({
  name: 'local-network-access'
})

console.log(permissionStatus.state) // 'granted', 'prompt', or 'denied'

// Listen for permission changes
permissionStatus.addEventListener('change', () => {
  console.log(`Permission changed to: ${permissionStatus.state}`)
})
```

### Making Requests

```typescript
// Explicit LNA request with targetAddressSpace
const response = await fetch('http://192.168.1.1/api', {
  targetAddressSpace: 'local' // or 'private'
})

const data = await response.json()
```

**Note:** `targetAddressSpace` is an experimental option. Use `@ts-ignore` in TypeScript:

```typescript
// @ts-ignore - targetAddressSpace is experimental
const response = await fetch(url, { targetAddressSpace: 'local' })
```

### Feature Detection

```typescript
async function checkLNASupport() {
  // Check secure context (HTTPS required)
  if (!window.isSecureContext) {
    return { supported: false, reason: 'HTTPS required' }
  }

  // Check Permissions API
  if (!navigator.permissions) {
    return { supported: false, reason: 'Permissions API unavailable' }
  }

  try {
    await navigator.permissions.query({ name: 'local-network-access' })
    return { supported: true }
  } catch (error) {
    return { supported: false, reason: 'LNA not recognized' }
  }
}
```

## Server Requirements

### CORS Headers

Servers must respond with LNA-specific CORS headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Private-Network: true
```

### Preflight Requests

Browser sends OPTIONS request before actual request:

```http
OPTIONS /api HTTP/1.1
Access-Control-Request-Private-Network: true
```

Server must respond:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Private-Network: true
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
```

### Device Identification Headers

Required for permission prompt to show device name:

```http
Private-Network-Access-Name: my-device
Private-Network-Access-ID: 00:11:22:33:44:55
```

**Validation Rules:**
- **Name**: Alphanumeric + `_-.` characters, max 248 UTF-8 code units, matches `/^[a-z0-9_-.]+$/`
- **ID**: MAC address format (6 hex bytes with colons), e.g., `00:11:22:33:44:55`

### Node.js/Express Example

```javascript
const express = require('express')
const app = express()

// Handle OPTIONS preflight
app.options('*', (req, res) => {
  if (req.headers['access-control-request-private-network'] === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
  }
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(204).send()
})

// Set headers on all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Private-Network-Access-Name', 'my-server')
  res.setHeader('Private-Network-Access-ID', '00:11:22:33:44:55')
  next()
})

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from local network' })
})

app.listen(8080, '0.0.0.0', () => {
  console.log('Server running on port 8080')
})
```

## Security Considerations

### Secure Context Requirement

LNA only works over HTTPS. Exceptions:
- `localhost` (considered secure)
- `127.0.0.1` (considered secure)
- `.local` domains over HTTPS

### Mixed Content

HTTPS pages making HTTP requests to local devices:
- Normally blocked as mixed content
- `targetAddressSpace` option bypasses when permission granted

```typescript
// HTTPS page → HTTP local device (allowed with permission)
fetch('http://192.168.1.1/api', {
  targetAddressSpace: 'local' // Bypasses mixed content check
})
```

### Permission Scope

Permissions are granted per-origin:
- `https://example.com` gets separate permission from `https://app.example.com`
- Stored per-device (identified by Name/ID headers)
- User can revoke in browser settings

## Error Handling

### Common Errors

**TypeError: Failed to fetch**
- Permission denied
- Network unreachable
- CORS error

**SecurityError**
- Not in secure context
- Mixed content blocked

**Permission denied**
- User explicitly blocked
- Browser doesn't support LNA

### Best Practices

```typescript
async function safeLocalRequest(url) {
  try {
    // Check secure context
    if (!window.isSecureContext) {
      throw new Error('HTTPS required for LNA')
    }

    // Make request
    const response = await fetch(url, {
      targetAddressSpace: 'local'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()

  } catch (error) {
    if (error instanceof TypeError) {
      console.log('Network error - check permission, CORS, and device availability')
    } else if (error instanceof SecurityError) {
      console.log('Security error - check HTTPS and mixed content')
    }
    throw error
  }
}
```

## Testing Strategies

### Local Development

1. **Use HTTPS locally:**
   ```bash
   # Vite with HTTPS
   vite --host --https
   ```

2. **Or use localhost** (secure context exception):
   ```bash
   vite --host localhost
   ```

3. **Test with local server:**
   ```bash
   node test-server.js
   # Access via http://localhost:8080
   ```

### Permission States Testing

Test all three states:

**Prompt State:**
- Clear browser permissions
- First request triggers prompt

**Granted State:**
- Allow permission
- Subsequent requests succeed

**Denied State:**
- Block permission
- Requests fail immediately

### Browser Compatibility Testing

Test on:
- Chrome 142+ (supported)
- Chrome <142 (unsupported - handle gracefully)
- Firefox (unsupported)
- Safari (unsupported)
- HTTP vs HTTPS

## Common Patterns

### Permission Status Component

```typescript
function PermissionStatusDisplay() {
  const [status, setStatus] = useState<PermissionState>('prompt')

  useEffect(() => {
    navigator.permissions.query({ name: 'local-network-access' })
      .then(result => {
        setStatus(result.state)
        result.addEventListener('change', () => {
          setStatus(result.state)
        })
      })
      .catch(() => setStatus('denied'))
  }, [])

  return (
    <div>
      Permission: {status}
      {status === 'denied' && <p>LNA not supported or denied</p>}
    </div>
  )
}
```

### Graceful Degradation

```typescript
async function fetchWithFallback(url) {
  // Try with LNA
  try {
    const response = await fetch(url, { targetAddressSpace: 'local' })
    return await response.json()
  } catch (error) {
    console.log('LNA request failed, trying without targetAddressSpace')
    // Fallback: try without LNA-specific option
    const response = await fetch(url)
    return await response.json()
  }
}
```

## Enterprise Policies

Chrome/Edge support enterprise policies:

**Allow specific URLs:**
```json
{
  "LocalNetworkAccessAllowedForUrls": [
    "https://trusted-app.example.com"
  ]
}
```

**Block specific URLs:**
```json
{
  "LocalNetworkAccessBlockedForUrls": [
    "https://untrusted-site.example.com"
  ]
}
```

## Debugging Tips

### Chrome DevTools

1. **Check Console:** Permission errors appear as warnings/errors
2. **Network Tab:** See preflight OPTIONS requests
3. **Application > Storage:** Clear site data to reset permissions

### Permission State Debugging

```typescript
// Log permission changes
navigator.permissions.query({ name: 'local-network-access' })
  .then(status => {
    console.log(`Initial state: ${status.state}`)
    status.addEventListener('change', () => {
      console.log(`Changed to: ${status.state}`)
    })
  })
```

### Server Response Inspection

```typescript
fetch(url, { targetAddressSpace: 'local' })
  .then(response => {
    // Check LNA headers
    console.log('Private-Network-Access-Name:',
      response.headers.get('Private-Network-Access-Name'))
    console.log('Access-Control-Allow-Private-Network:',
      response.headers.get('Access-Control-Allow-Private-Network'))
  })
```

## References

### Official Documentation

- [Chrome Developers: New permission prompt for Local Network Access](https://developer.chrome.com/blog/local-network-access)
- [Chrome Developers: Private Network Access Permission prompt origin trial](https://developer.chrome.com/blog/pna-permission-prompt-ot)
- [Chrome Developers: Private Network Access preflights](https://developer.chrome.com/blog/private-network-access-preflight)
- [Microsoft Edge: Control website access to local network](https://support.microsoft.com/en-us/topic/control-a-website-s-access-to-the-local-network-in-microsoft-edge-ef7eff4c-676d-4105-935c-2acbcd841d51)

### Specifications

- [WICG: Local Network Access Specification](https://wicg.github.io/local-network-access/)
- [WICG: Private Network Access Specification](https://wicg.github.io/private-network-access/)
- [GitHub: Private Network Access Permission Prompt Explainer](https://github.com/WICG/private-network-access/blob/main/permission_prompt/explainer.md)

### Developer Resources

- [MDN: Navigator.permissions](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions)
- [MDN: Permissions.query()](https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query)
- [Paul Serban: Using navigator.permissions.query for LNA](https://paulserban.eu/blog/post/using-navigatorpermissionsquery-for-local-network-access-in-chrome/)
- [Paul Serban: Preparing Web App for Chrome's LNA Policies](https://paulserban.eu/blog/post/preparing-your-web-app-for-chromes-local-network-access-policies/)

### Browser Bugs & Tracking

- [Firefox Bug #1481298: Private Network Access](https://bugzilla.mozilla.org/show_bug.cgi?id=1481298)
- [Microsoft Edge Browser Policies](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/)

## Summary

**Key Takeaways:**
- LNA requires user permission for web→local network requests
- Chrome 142+ and Edge 143+ support (late 2025)
- HTTPS required (except localhost)
- Server needs CORS + LNA headers
- Permission states: granted, prompt, denied
- Use `navigator.permissions.query()` to check status
- Use `targetAddressSpace` fetch option for requests
- Graceful degradation for unsupported browsers essential

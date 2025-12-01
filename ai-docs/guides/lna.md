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
- **Current Behavior:** Works without LNA permission prompts (no enforcement yet)

**Safari:**
- Status: Not supported for web
- macOS/iOS: OS-level permissions for native apps only
- **Current Behavior:** Blocks requests to localhost from public origins

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

## Empirical Testing Results (December 2025)

Testing was conducted using the LNA Permissions Explorer app deployed on GitHub Pages (`https://anagri.github.io/exp-lna-permissions/`) against localhost servers on ports 8080 and 1135.

### Chrome 142.0.0.0 (macOS)

**Permission Query API:**
- ✅ `navigator.permissions.query({ name: 'local-network-access' })` - **Supported**
- Permission state: **GRANTED** (after user approval)
- Secure context detection: **Yes** (HTTPS)
- Browser detection: **Chrome 142+ supports LNA**

**Fetch Behavior:**

| targetAddressSpace | Behavior | Result |
|-------------------|----------|--------|
| `"local"` | CORS error: "target IP address space of `unknown` yet resource is in address space `loopback`" | ❌ **BLOCKED** |
| `"private"` | CORS error: "target IP address space of `unknown` yet resource is in address space `loopback`" | ❌ **BLOCKED** |
| `none` (omitted) | Request succeeds after permission granted | ✅ **WORKS** |

**Findings:**
- Chrome 142 has a **bug** where explicit `targetAddressSpace` parameter triggers "unknown" error
- Omitting `targetAddressSpace` works correctly with granted permission
- Permission cached from experimental/preview phase may cause conflicts
- **Workaround:** Reset site permissions and use fetch without `targetAddressSpace`

**Permission Reset Required:**
Users who enabled LNA during Chrome's experimental phase (flags) need to reset permissions:
1. Visit `chrome://settings/content/all`
2. Search for site and remove "Local Network Access" permission
3. Re-grant when prompted on fresh request

### Microsoft Edge (Chromium-based)

**Behavior:**
- ✅ Works **without permission prompt**
- No LNA enforcement yet (as of December 2025)
- Edge 143+ scheduled for LNA rollout (December 1-7, 2025)
- All `targetAddressSpace` options work

### Firefox (Latest)

**Behavior:**
- ✅ Works **without permission prompt**
- No LNA enforcement (prototyping phase)
- All `targetAddressSpace` options work
- No `navigator.permissions.query()` support for LNA

### Safari (macOS)

**Behavior:**
- ❌ **Blocks** all requests to localhost from public origins
- No LNA API support
- No permission prompt mechanism
- CORS errors regardless of server headers

### Cross-Browser Compatibility Table

| Browser | LNA API | Permission Prompt | targetAddressSpace: local | targetAddressSpace: private | targetAddressSpace: none |
|---------|---------|-------------------|---------------------------|----------------------------|-------------------------|
| Chrome 142+ | ✅ | ✅ | ❌ (bug) | ❌ (bug) | ✅ |
| Edge 142 | ✅ | ❌ (not yet) | ✅ | ✅ | ✅ |
| Firefox | ❌ | ❌ | ✅ | ✅ | ✅ |
| Safari | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Supported/Works
- ❌ Not supported/Blocked
- ❌ (bug) - Supported but has known issues
- ❌ (not yet) - Scheduled but not active

## Known Issues & Workarounds

### Chrome 142: targetAddressSpace "unknown" Error

**Issue:**
```
Access to fetch at 'http://localhost:8080/' from origin 'https://anagri.github.io'
has been blocked by CORS policy: Request had a target IP address space of `unknown`
yet the resource is in address space `loopback`.
```

**Root Cause:**
- Chrome's address space detection fails when `targetAddressSpace` is explicitly set
- May be related to cached permissions from experimental phase
- Affects both `"local"` and `"private"` values

**Workaround:**
```javascript
// Option 1: Omit targetAddressSpace (works in Chrome 142)
fetch('http://localhost:8080/')

// Option 2: Feature detection and fallback
async function safeFetch(url, addressSpace = 'local') {
  try {
    // Try with targetAddressSpace first
    return await fetch(url, { targetAddressSpace: addressSpace })
  } catch (error) {
    // Fallback: retry without parameter
    console.log('Retrying without targetAddressSpace')
    return await fetch(url)
  }
}
```

### Safari: No LNA Support

**Issue:**
Safari blocks all localhost requests from public origins without any permission mechanism.

**Workaround:**
- Use HTTPS proxy for local development
- Deploy to localhost during testing
- Inform users Safari is not supported

## Recommendations for Developers

### Production-Ready Pattern (December 2025)

```javascript
async function fetchLocalNetwork(url) {
  // Check if browser supports Permissions API
  if (!navigator.permissions) {
    // Firefox/Safari: Just try the request
    return fetch(url)
  }

  try {
    // Check permission state (Chrome/Edge)
    const permission = await navigator.permissions.query({
      name: 'local-network-access'
    })

    if (permission.state === 'denied') {
      throw new Error('Local network access denied')
    }

    // Chrome 142 bug: omit targetAddressSpace for now
    // Will be fixed in future Chrome versions
    return fetch(url)

  } catch (error) {
    // LNA not supported: fallback to regular fetch
    return fetch(url)
  }
}
```

### Testing Strategy

1. **Chrome 142+:** Test with and without `targetAddressSpace`, verify permission prompts
2. **Edge:** Test before and after Edge 143 rollout (Dec 2025)
3. **Firefox:** Test without expecting permission prompts
4. **Safari:** Document as unsupported, test blocking behavior
5. **Reset Permissions:** Clear Chrome site data to test fresh permission flow

### Future-Proofing

When Chrome fixes the `targetAddressSpace` bug:

```javascript
async function fetchLocalNetwork(url, addressSpace = 'local') {
  if (!navigator.permissions) {
    return fetch(url)
  }

  try {
    const permission = await navigator.permissions.query({
      name: 'local-network-access'
    })

    if (permission.state === 'denied') {
      throw new Error('Local network access denied')
    }

    // Future: This should work when Chrome bug is fixed
    return fetch(url, { targetAddressSpace: addressSpace })

  } catch (error) {
    // Fallback for unsupported browsers
    return fetch(url)
  }
}
```

## Summary

**Key Takeaways:**
- LNA requires user permission for web→local network requests
- Chrome 142+ and Edge 143+ support (late 2025)
- HTTPS required (except localhost)
- Server needs CORS + LNA headers
- Permission states: granted, prompt, denied
- Use `navigator.permissions.query()` to check status
- **Chrome 142 bug:** Omit `targetAddressSpace` parameter for now
- Firefox/Edge work without permission prompts (as of Dec 2025)
- Safari blocks all localhost requests without LNA support
- Graceful degradation for unsupported browsers essential

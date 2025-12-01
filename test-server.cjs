const http = require('http')

const PORT = 8080
const HOST = '0.0.0.0'

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
    res.setHeader('Private-Network-Access-Name', 'test-server')
    res.setHeader('Private-Network-Access-ID', '00:11:22:33:44:55')
    res.writeHead(204)
    res.end()
    return
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Private-Network-Access-Name', 'test-server')
  res.setHeader('Private-Network-Access-ID', '00:11:22:33:44:55')
  res.setHeader('Content-Type', 'application/json')

  const responseData = {
    message: 'Hello from local network!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    headers: req.headers,
    serverInfo: {
      hostname: require('os').hostname(),
      platform: require('os').platform(),
      nodeVersion: process.version,
    },
  }

  res.writeHead(200)
  res.end(JSON.stringify(responseData, null, 2))
})

server.listen(PORT, HOST, () => {
  console.log('='.repeat(60))
  console.log('LNA Test Server Running')
  console.log('='.repeat(60))
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`Network: http://<your-local-ip>:${PORT}`)
  console.log('')
  console.log('CORS and LNA headers configured:')
  console.log('  - Access-Control-Allow-Origin: *')
  console.log('  - Access-Control-Allow-Private-Network: true')
  console.log('  - Private-Network-Access-Name: test-server')
  console.log('  - Private-Network-Access-ID: 00:11:22:33:44:55')
  console.log('')
  console.log('Example requests:')
  console.log(`  curl http://localhost:${PORT}`)
  console.log(`  curl http://localhost:${PORT}/api/test`)
  console.log('='.repeat(60))
})

server.on('error', (err) => {
  console.log('Server error:', err)
  process.exit(1)
})

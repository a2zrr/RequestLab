import { serve } from '@hono/node-server'
import app from './app.ts'

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001

serve(
  {
    fetch: app.fetch,
    hostname: '127.0.0.1',
    port: PORT,
  },
  (info) => {
    console.log(`RequestLab proxy listening on http://${info.address}:${info.port}`)
  },
)

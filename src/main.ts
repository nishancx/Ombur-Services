import 'dotenv/config'
import express, { Request } from 'express'
import cookieParser from 'cookie-parser'
import { decode } from 'next-auth/jwt'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const sseIdMap: Map<string, WritableStreamDefaultWriter<any>> = new Map()

const app = express()
app.use(cookieParser())
const port = process.env.PORT

app.get('/register-sse', async (req: Request, res) => {
  const session = await getSession({ req })
  const senderEmail = session?.email

  if (!senderEmail) {
    return
  }

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }
  res.writeHead(200, headers)

  const data = `data: ${JSON.stringify(Date.now())}\n\n`

  setInterval(() => {
    res.write(data)
  }, 1000)

  res.on('close', () => {
    // eslint-disable-next-line no-console
    console.log(`Connection closed`)
  })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

const getSession = async ({ req }: { req: Request }) => {
  let sessionTokenName = ''
  let sessionTokenValue = ''

  if (!!req.cookies['__Secure-authjs.session-token']) {
    sessionTokenName = '__Secure-authjs.session-token'
    sessionTokenValue = req.cookies['__Secure-authjs.session-token']
  }

  if (!!req.cookies['authjs.session-token']) {
    sessionTokenName = 'authjs.session-token'
    sessionTokenValue = req.cookies['authjs.session-token']
  }

  return await decode({
    token: sessionTokenValue,
    secret: process.env.AUTH_SECRET || '',
    salt: sessionTokenName || '',
  })
}

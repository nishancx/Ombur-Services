import 'dotenv/config'
import express, { Request } from 'express'
import cookieParser from 'cookie-parser'
import { decode } from 'next-auth/jwt'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const sseIdMap: Map<string, WritableStreamDefaultWriter<any>> = new Map()

const app = express()
app.use(cookieParser())
const port = process.env.PORT

app.get('/', (req, res) => {
  // eslint-disable-next-line no-console
  console.log('home')
  return res.send('Hello World!')
})

app.get('/register-sse', async (req: Request, res) => {
  // eslint-disable-next-line no-console
  console.log('register-sse')
  const session = await getSession({ req })
  const senderEmail = session?.email
  // eslint-disable-next-line no-console
  console.log(req.cookies)
  // eslint-disable-next-line no-console
  console.log('senderEmail', senderEmail)
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
  // eslint-disable-next-line no-console
  console.log('writing data out of interval')
  res.write(data)

  setInterval(() => {
    // eslint-disable-next-line no-console
    console.log('writing data')
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

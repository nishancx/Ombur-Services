/* eslint-disable no-console */
import 'dotenv/config'
import express, { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { decode } from 'next-auth/jwt'
import { jsonParse } from './utils/object.js'

const app = express()
app.use(cookieParser())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*') // Adjust origin as needed
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

const port = process.env.PORT

const resMap: Map<string, Response> = new Map()

app.get('/', (req, res) => {
  console.log('home')
  return res.send('Hello World!')
})

app.get('/register-sse', async (req: Request, res) => {
  const session = await getSession({ req })
  const senderEmail = session?.email

  console.log({ senderEmail })

  if (!senderEmail) {
    return
  }

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }
  res.writeHead(200, headers)
  res.on('close', () => {
    console.log(`Connection closed`)
  })

  resMap.set('res', res)
})

app.get('/send-message', async (req, res) => {
  console.log('send-message', Array.from(resMap.keys()))
  resMap.get('res')?.write(`data: message sent ${JSON.stringify(Date.now())}\n\n`)

  return res.send('Message sent')
})
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})

const getSession = async ({ req }: { req: Request }) => {
  console.log(req.headers)
  const token = req.headers.authorization?.split(' ')[1]
  const cookieRaw = atob(token || '')
  console.log({ cookieRaw })
  const cookie = jsonParse(cookieRaw)

  if (!token) {
    return null
  }

  return await decode({
    token: cookie?.value,
    secret: process.env.AUTH_SECRET || '',
    salt: cookie?.name || '',
  })
}

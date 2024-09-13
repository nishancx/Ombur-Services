import { connectDB } from './libs/mongo.js'
import { Clients } from './libs/models/client.js'
import { Users } from './libs/models/user.js'
import { createMessageValidationSchema } from './validations/issue.js'
import { MESSAGE } from './constants/message.js'
import { Messages } from './libs/models/message.js'
import { serverConfig } from './libs/config.js'

import express, { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { decode } from 'next-auth/jwt'
import cors from 'cors'

// const ALLOWED_ORIGINS = ['https://ombur.vercel.app', 'http://localhost:3000']
const port = serverConfig.port || 8080
const resMap: Map<string, Response> = new Map()

const app = express()
app.set('trust proxy', 1)
app.use(
  cors({
    credentials: true,
    preflightContinue: true,
    // origin: true,
    // preflightContinue: true,
    origin: (origin, callback) => {
      // eslint-disable-next-line no-console
      console.log('\n\norigin: ', origin)
      // if (ALLOWED_ORIGINS.includes(origin || '') || !origin) {
      callback(null, true)
      // } else {
      // callback(new Error('Not allowed by CORS'))
      // }
    },
    allowedHeaders: ['Content-Type', '*'],
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
)
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  return res.send('Hello World!')
})

app.get('/version', (req, res) => {
  return res.send(serverConfig.renderGitCommit)
})

app.get('/register-sse', async (req: Request, res) => {
  // eslint-disable-next-line no-console
  console.log('register-sse')
  // eslint-disable-next-line no-console
  console.log('req.headers', req.headers)
  // eslint-disable-next-line no-console
  console.log('req.cookies', req.cookies)
  const session = await getSession({ req })
  const senderEmail = session?.email
  // eslint-disable-next-line no-console
  console.log('senderEmail', senderEmail)
  if (!senderEmail) {
    res.status(401).send('Unauthorized')
    return
  }

  await connectDB()

  const sender = await getSender({ email: senderEmail })

  if (!sender) {
    res.status(401).send('Unauthorized')
    return
  }

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }

  res.writeHead(200, headers)
  res.on('close', () => {
    resMap.delete(sender?._id?.toString())
    res.end()
  })

  !!sender?._id && resMap.set(sender?._id?.toString(), res)
})

app.post('/send-message', async (req, res) => {
  // eslint-disable-next-line no-console
  console.log('send-message')
  // eslint-disable-next-line no-console
  console.log('req.headers', req.headers)
  // eslint-disable-next-line no-console
  console.log('req.cookies', req.cookies)
  const session = await getSession({ req })
  const senderEmail = session?.email

  // eslint-disable-next-line no-console
  console.log('senderEmail', senderEmail)
  if (!senderEmail) {
    return
  }

  await connectDB()

  const senderDetails = await getSender({ email: senderEmail })

  if (!senderDetails) {
    return
  }

  const body = req.body
  const { text, issueId, userId, clientId, sender } = body

  const isPayloadValid = createMessageValidationSchema.safeParse({
    text,
    issueId,
    userId,
    clientId,
    sender,
  })

  if (!isPayloadValid.success) {
    return res.status(400).send(isPayloadValid.error)
  }

  if (sender === MESSAGE.SENDER_TYPE_INDEX.CLIENT) {
    const client = await Clients.findOne({ email: senderEmail })

    if (!client) {
      throw new Error('Client not found')
    }
  }

  if (sender === MESSAGE.SENDER_TYPE_INDEX.USER) {
    const user = await Users.findOne({ username: senderEmail })

    if (!user) {
      throw new Error('User not found')
    }
  }

  const newMessage = await Messages.create({
    sender,
    issueId,
    userId,
    clientId,
    text,
  })

  const receiverId = sender === MESSAGE.SENDER_TYPE_INDEX.CLIENT ? userId : clientId

  const receiverWriter = resMap.get(receiverId)

  if (receiverWriter) {
    const encoder = new TextEncoder()

    receiverWriter.write(encoder.encode(`data: ${JSON.stringify(newMessage)}\n\n`))
  }

  return res.send(newMessage)
})
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server]: Server is running at port:${port}`)
})

const getSession = async ({ req }: { req: Request }) => {
  let name = ''
  let value = ''

  const httpsToken = req.cookies?.['__Secure-authjs.session-token']
  if (!!httpsToken) {
    name = '__Secure-authjs.session-token'
    value = httpsToken || ''
  }

  const httpToken = req.cookies?.['authjs.session-token']
  if (!!httpToken) {
    name = 'authjs.session-token'
    value = httpToken
  }

  if (!value) {
    return null
  }

  return await decode({
    token: value,
    secret: serverConfig.authSecret || '',
    salt: name || '',
  })
}

const getSender = async ({ email }: { email: string }) => {
  await connectDB()

  if (email.includes('@')) {
    return await Clients.findOne({ email: email })
  }

  return await Users.findOne({ username: email })
}

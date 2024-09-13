import { connectDB } from './libs/mongo.js'
import { Clients } from './libs/models/client.js'
import { Users } from './libs/models/user.js'
import { createMessageValidationSchema } from './validations/issue.js'
import { MESSAGE } from './constants/message.js'
import { Messages } from './libs/models/message.js'
import { serverConfig } from './libs/config.js'
import { jsonParse } from './utils/object.js'

import express, { Request, Response } from 'express'
import { decode } from 'next-auth/jwt'
import cors from 'cors'
import { randomUUID } from 'crypto'

const port = serverConfig.port || 8080
const resMap: Map<
  string,
  {
    id: string
    res: Response
  }[]
> = new Map()
const ALLOWED_ORIGINS = ['https://ombur.vercel.app', 'http://localhost:3000']

const app = express()
app.use(express.json())
app.use(
  cors({
    credentials: true,
    preflightContinue: true,
    origin: (origin, callback) => {
      if (ALLOWED_ORIGINS.includes(origin || '') || !origin) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.get('/', (req, res) => {
  return res.send('Hello World!')
})

app.get('/version', (req, res) => {
  return res.send(serverConfig.renderGitCommit)
})

app.get('/register-sse', async (req: Request, res) => {
  const session = await getSession({ req })
  const senderEmail = session?.email

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

  const senderId = sender?._id?.toString()
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }

  res.writeHead(200, headers)
  const previousWriters = resMap.get(senderId) || []

  res.on('close', () => {
    const newWriters = previousWriters.filter(writer => writer.id !== senderId)

    if (!newWriters.length) {
      resMap.delete(senderId)
    } else {
      resMap.set(senderId, newWriters)
    }

    res.end()
  })

  if (sender?._id) {
    resMap.set(senderId, [...previousWriters, { id: randomUUID(), res }])
  }
})

app.post('/send-message', async (req, res) => {
  const session = await getSession({ req })
  const senderEmail = session?.email

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

  const receiverWriters = resMap.get(receiverId)

  receiverWriters?.forEach(writer => {
    writer.res.write(`data: ${JSON.stringify(newMessage)}\n\n`)
  })

  return res.send(newMessage)
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server]: Server is running at port:${port}`)
})

const getSession = async ({ req }: { req: Request }) => {
  const authorization = req.headers?.authorization

  if (!authorization) {
    return null
  }

  const token = authorization.split(' ')[1]

  if (!token) {
    return null
  }

  const rawCookies = atob(token)

  if (!rawCookies) {
    return null
  }

  const cookies = jsonParse(rawCookies)

  if (!cookies) {
    return null
  }

  const { name, value } = cookies

  if (!name || !value) {
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

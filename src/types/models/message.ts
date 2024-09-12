import { MESSAGE } from 'src/constants/message'

type Message = {
  _id: string
  issueId: string
  sender: typeof MESSAGE.SENDER_TYPE_INDEX.CLIENT | typeof MESSAGE.SENDER_TYPE_INDEX.USER
  clientId: string
  userId: string
  text: string
  createdAt: Date
  updatedAt: Date
}

export type { Message }

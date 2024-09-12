import { MESSAGE } from '../../constants/message.js'
import { Message } from '../../types/models/message.js'

import mongoose, { Schema } from 'mongoose'

const messageSchema = new Schema<Message>(
  {
    issueId: { type: String, required: true },
    sender: {
      type: String,
      enum: {
        values: [MESSAGE.SENDER_TYPE_INDEX.CLIENT, MESSAGE.SENDER_TYPE_INDEX.USER],
        message: 'Transaction Type is not supported',
      },
      required: true,
    },
    clientId: { type: String, required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

const Messages =
  (mongoose.models.Messages as mongoose.Model<
    Message,
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    Message
  >) || mongoose.model<Message>('Messages', messageSchema)

export { Messages }

import { MESSAGE } from '../constants/message.js'
import { z } from 'zod'

const createMessageValidationSchema = z.object({
  text: z.string({ required_error: 'Message text is required' }).min(1),
  sender: z.enum([MESSAGE.SENDER_TYPE_INDEX.CLIENT, MESSAGE.SENDER_TYPE_INDEX.USER]),
  issueId: z.string({ required_error: 'Issue ID is required' }),
  userId: z.string({ required_error: 'User ID is required' }),
  clientId: z.string({ required_error: 'Client ID is required' }),
})
type CreateMessageDTO = z.infer<typeof createMessageValidationSchema>

export { createMessageValidationSchema }
export type { CreateMessageDTO }

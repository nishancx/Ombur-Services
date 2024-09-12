const SENDER_TYPE_INDEX = {
  CLIENT: 'client',
  USER: 'user',
} as const

const SENDER_TYPES = Object.values(SENDER_TYPE_INDEX) as string[]

export const MESSAGE = {
  SENDER_TYPE_INDEX,
  SENDER_TYPES,
}

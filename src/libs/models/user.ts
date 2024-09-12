import { User } from '../../types/models/user.js'

import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

const Users =
  (mongoose.models.Users as mongoose.Model<
    User,
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    User
  >) || mongoose.model<User>('Users', userSchema)

export { Users }

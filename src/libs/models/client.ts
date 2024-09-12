import mongoose, { Schema } from 'mongoose'
import { Client } from '../../types/models/client.js'

const clientSchema = new Schema<Client>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: String,
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

const Clients =
  (mongoose.models.Clients as mongoose.Model<
    Client,
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    Client
  >) || mongoose.model<Client>('Clients', clientSchema)

export { Clients }

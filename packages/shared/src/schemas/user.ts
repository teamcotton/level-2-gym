import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().optional(),
})

export const PublicUserSchema = UserSchema.pick({ id: true, name: true, email: true })

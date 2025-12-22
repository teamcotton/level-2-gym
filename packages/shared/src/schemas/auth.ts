import { z } from 'zod'
import { UserSchema } from './user.js'

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

export const RegisterSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Please enter a valid email address' }),
    name: z.string().min(1, { message: 'Name is required' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      token: z.string().optional(),
      user: UserSchema.optional(),
    })
    .optional(),
  error: z.string().optional(),
  status: z.number().optional(),
})

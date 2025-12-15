import { z } from 'zod'

// Value object schemas
export const EmailSchema = z.email('Please enter a valid email address')
export const PasswordSchema = z.string().min(12, 'Password must be at least 12 characters')
export const NameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')

// Registration form schema
export const RegistrationFormSchema = z.object({
  email: EmailSchema,
  name: NameSchema,
  password: PasswordSchema,
  confirmPassword: PasswordSchema,
})

// Sign-in form schema
export const SignInFormSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Types
export type RegistrationFormData = z.infer<typeof RegistrationFormSchema>
export type SignInFormData = z.infer<typeof SignInFormSchema>

export interface RegisterUserData extends Record<string, string> {
  email: string
  name: string
  password: string
}

export interface RegisterUserResponse {
  success: boolean
  data?: {
    userId: string
    email: string
    name: string
  }
  error?: string
}

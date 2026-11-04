import { z } from 'zod';

// Password rule from the spec: min 8 chars, at least one letter + one number.
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Add at least one letter')
  .regex(/[0-9]/, 'Add at least one number');

export const loginSchema = z.object({
  email: z.string().email('That email looks off'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'What should I call you?').max(60),
  email: z.string().email('That email looks off'),
  password,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('That email looks off'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters.')
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|_~+=-]).*$/,
        'Password must contain at least one uppercase letter, one number, and one special character.'
      ),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits.'),
    avatar: z.string().optional(),
    role: z.enum(['USER', 'VILLAGE_OWNER', 'ADMIN']).optional(),
    locale: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});


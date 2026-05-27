import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format.'),
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
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

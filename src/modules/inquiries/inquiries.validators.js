import { z } from 'zod';

export const createInquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number')
    .optional()
    .or(z.literal('')),
  message: z.string().max(1000).optional().or(z.literal('')),
  website: z.string().optional(), // honeypot — checked manually in controller, not enforced here
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
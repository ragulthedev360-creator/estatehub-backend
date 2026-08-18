import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(5000).optional(),
  propertyType: z.enum(['apartment', 'villa', 'plot', 'commercial']),
  listingType: z.enum(['sale', 'rent']),
  price: z.coerce.number().positive('Price must be greater than 0'),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().int().min(0).max(20).optional(),
  areaSqft: z.coerce.number().positive().optional(),
  city: z.string().min(2).max(100),
  locality: z.string().max(120).optional(),
  address: z.string().max(500).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

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
 

export const searchQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  propertyType: z.enum(['apartment', 'villa', 'plot', 'commercial']).optional(),
  listingType: z.enum(['sale', 'rent']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  q: z.string().trim().max(200).optional(), // free-text search
  sort: z
    .enum(['newest', 'price_asc', 'price_desc'])
    .optional()
    .default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid search parameters',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}
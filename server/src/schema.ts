import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  created_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type Customer = z.infer<typeof customerSchema>;

// Input schema for creating customers
export const createCustomerInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required')
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Input schema for updating customers
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  address: z.string().min(1, 'Address is required').optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Search input schema
export const searchCustomersInputSchema = z.object({
  query: z.string().min(1, 'Search query is required')
});

export type SearchCustomersInput = z.infer<typeof searchCustomersInputSchema>;

// Get customer by ID input schema
export const getCustomerInputSchema = z.object({
  id: z.number()
});

export type GetCustomerInput = z.infer<typeof getCustomerInputSchema>;
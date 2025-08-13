import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Customer = typeof customersTable.$inferSelect; // For SELECT operations
export type NewCustomer = typeof customersTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { customers: customersTable };
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type SearchCustomersInput, type Customer } from '../schema';
import { or, ilike } from 'drizzle-orm';

export const searchCustomers = async (input: SearchCustomersInput): Promise<Customer[]> => {
  try {
    // Build case-insensitive search query for name and email
    const searchPattern = `%${input.query}%`;
    
    const results = await db.select()
      .from(customersTable)
      .where(
        or(
          ilike(customersTable.name, searchPattern),
          ilike(customersTable.email, searchPattern)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Customer search failed:', error);
    throw error;
  }
};
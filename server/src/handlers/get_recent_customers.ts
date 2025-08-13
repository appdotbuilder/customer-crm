import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { desc } from 'drizzle-orm';

export const getRecentCustomers = async (): Promise<Customer[]> => {
  try {
    // Query the last 10 customers ordered by creation date (most recent first)
    const results = await db.select()
      .from(customersTable)
      .orderBy(desc(customersTable.created_at))
      .limit(10)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch recent customers:', error);
    throw error;
  }
};
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type GetCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomer = async (input: GetCustomerInput): Promise<Customer | null> => {
  try {
    // Query customer by ID
    const result = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    // Return null if customer not found
    if (result.length === 0) {
      return null;
    }

    // Return the first (and only) customer
    return result[0];
  } catch (error) {
    console.error('Customer retrieval failed:', error);
    throw error;
  }
};
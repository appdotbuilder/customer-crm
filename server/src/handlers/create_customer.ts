import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address
      })
      .returning()
      .execute();

    // Return the created customer (no numeric conversions needed for this schema)
    return result[0];
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};
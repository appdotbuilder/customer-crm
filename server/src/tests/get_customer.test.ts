import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type GetCustomerInput } from '../schema';
import { getCustomer } from '../handlers/get_customer';

// Test customer data
const testCustomer = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  address: '123 Main St, City, State 12345'
};

describe('getCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing customer by ID', async () => {
    // Create a test customer
    const insertResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const createdCustomer = insertResult[0];
    
    // Test input
    const input: GetCustomerInput = {
      id: createdCustomer.id
    };

    const result = await getCustomer(input);

    // Verify customer is returned
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.phone).toEqual('555-0123');
    expect(result!.address).toEqual('123 Main St, City, State 12345');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent customer ID', async () => {
    // Test with a non-existent ID
    const input: GetCustomerInput = {
      id: 999999 // Very unlikely to exist
    };

    const result = await getCustomer(input);

    expect(result).toBeNull();
  });

  it('should return null for customer ID 0', async () => {
    // Test edge case with ID 0
    const input: GetCustomerInput = {
      id: 0
    };

    const result = await getCustomer(input);

    expect(result).toBeNull();
  });

  it('should return correct customer when multiple customers exist', async () => {
    // Create multiple test customers
    const customers = [
      { name: 'Alice Smith', email: 'alice@example.com', phone: '555-1111', address: '100 Oak Ave' },
      { name: 'Bob Johnson', email: 'bob@example.com', phone: '555-2222', address: '200 Pine St' },
      { name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-3333', address: '300 Elm Dr' }
    ];

    const insertResults = await db.insert(customersTable)
      .values(customers)
      .returning()
      .execute();

    // Get the second customer
    const targetCustomer = insertResults[1];
    const input: GetCustomerInput = {
      id: targetCustomer.id
    };

    const result = await getCustomer(input);

    // Verify we get the correct customer
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetCustomer.id);
    expect(result!.name).toEqual('Bob Johnson');
    expect(result!.email).toEqual('bob@example.com');
    expect(result!.phone).toEqual('555-2222');
    expect(result!.address).toEqual('200 Pine St');
  });

  it('should handle negative customer IDs gracefully', async () => {
    // Test with negative ID
    const input: GetCustomerInput = {
      id: -1
    };

    const result = await getCustomer(input);

    expect(result).toBeNull();
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer data
const testCustomers: CreateCustomerInput[] = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    address: '123 Main St, Anytown, USA'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    address: '456 Oak Ave, Another City, USA'
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1-555-0125',
    address: '789 Pine Rd, Third Town, USA'
  }
];

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all customers from database', async () => {
    // Insert test customers
    await db.insert(customersTable)
      .values(testCustomers)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Verify all customers are returned
    const names = result.map(customer => customer.name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Jane Smith');
    expect(names).toContain('Bob Johnson');
  });

  it('should return customers with all required fields', async () => {
    // Insert a single customer
    await db.insert(customersTable)
      .values([testCustomers[0]])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    // Verify all required fields are present
    expect(customer.id).toBeDefined();
    expect(typeof customer.id).toBe('number');
    expect(customer.name).toEqual('John Doe');
    expect(customer.email).toEqual('john.doe@example.com');
    expect(customer.phone).toEqual('+1-555-0123');
    expect(customer.address).toEqual('123 Main St, Anytown, USA');
    expect(customer.created_at).toBeInstanceOf(Date);
  });

  it('should return customers ordered by database insertion order', async () => {
    // Insert customers in specific order
    for (const customer of testCustomers) {
      await db.insert(customersTable)
        .values([customer])
        .execute();
    }

    const result = await getCustomers();

    expect(result).toHaveLength(3);

    // Verify customers are returned in insertion order (by id)
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[2].name).toEqual('Bob Johnson');

    // Verify IDs are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });

  it('should handle large number of customers', async () => {
    // Create many test customers
    const manyCustomers = Array.from({ length: 50 }, (_, index) => ({
      name: `Customer ${index + 1}`,
      email: `customer${index + 1}@example.com`,
      phone: `+1-555-${String(index + 1).padStart(4, '0')}`,
      address: `${index + 1} Test St, City ${index + 1}, USA`
    }));

    await db.insert(customersTable)
      .values(manyCustomers)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(50);
    expect(Array.isArray(result)).toBe(true);

    // Verify first and last customers
    expect(result[0].name).toEqual('Customer 1');
    expect(result[49].name).toEqual('Customer 50');
  });

  it('should return customers with valid timestamps', async () => {
    // Insert customer and immediately query
    const beforeInsert = new Date();
    
    await db.insert(customersTable)
      .values([testCustomers[0]])
      .execute();

    const afterInsert = new Date();
    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    // Verify timestamp is within reasonable range
    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.created_at >= beforeInsert).toBe(true);
    expect(customer.created_at <= afterInsert).toBe(true);
  });
});
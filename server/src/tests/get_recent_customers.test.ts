import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getRecentCustomers } from '../handlers/get_recent_customers';

// Test customer data
const testCustomers: CreateCustomerInput[] = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '555-0001',
    address: '123 Main St'
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '555-0002',
    address: '456 Oak Ave'
  },
  {
    name: 'Carol Williams',
    email: 'carol@example.com',
    phone: '555-0003',
    address: '789 Pine Rd'
  }
];

describe('getRecentCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getRecentCustomers();
    
    expect(result).toEqual([]);
  });

  it('should return customers ordered by creation date (most recent first)', async () => {
    // Create customers with slight delays to ensure different timestamps
    const customer1 = await db.insert(customersTable)
      .values(testCustomers[0])
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const customer2 = await db.insert(customersTable)
      .values(testCustomers[1])
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 1));

    const customer3 = await db.insert(customersTable)
      .values(testCustomers[2])
      .returning()
      .execute();

    const result = await getRecentCustomers();

    expect(result).toHaveLength(3);
    
    // Verify order - most recent first (Carol, Bob, Alice)
    expect(result[0].name).toEqual('Carol Williams');
    expect(result[1].name).toEqual('Bob Smith');
    expect(result[2].name).toEqual('Alice Johnson');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should limit results to 10 customers', async () => {
    // Create 12 customers to test the limit
    const customers = [];
    for (let i = 1; i <= 12; i++) {
      customers.push({
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `555-000${i}`,
        address: `${i} Test St`
      });
    }

    // Insert all customers
    for (const customer of customers) {
      await db.insert(customersTable)
        .values(customer)
        .execute();
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const result = await getRecentCustomers();

    expect(result).toHaveLength(10);
    
    // Verify we get the most recent 10 (Customer 12 down to Customer 3)
    expect(result[0].name).toEqual('Customer 12');
    expect(result[9].name).toEqual('Customer 3');
  });

  it('should return correct customer data structure', async () => {
    await db.insert(customersTable)
      .values(testCustomers[0])
      .execute();

    const result = await getRecentCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    expect(customer.id).toBeDefined();
    expect(typeof customer.id).toBe('number');
    expect(customer.name).toEqual('Alice Johnson');
    expect(customer.email).toEqual('alice@example.com');
    expect(customer.phone).toEqual('555-0001');
    expect(customer.address).toEqual('123 Main St');
    expect(customer.created_at).toBeInstanceOf(Date);
  });

  it('should handle single customer correctly', async () => {
    await db.insert(customersTable)
      .values(testCustomers[0])
      .execute();

    const result = await getRecentCustomers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Alice Johnson');
  });
});
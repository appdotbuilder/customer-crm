import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State 12345'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all required fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Main St, City, State 12345');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query database to verify persistence
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].address).toEqual('123 Main St, City, State 12345');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple customers with unique IDs', async () => {
    const input1: CreateCustomerInput = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+1111111111',
      address: '456 Oak Ave'
    };

    const input2: CreateCustomerInput = {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+2222222222',
      address: '789 Pine St'
    };

    const customer1 = await createCustomer(input1);
    const customer2 = await createCustomer(input2);

    // Verify unique IDs
    expect(customer1.id).not.toEqual(customer2.id);
    expect(customer1.name).toEqual('Alice Smith');
    expect(customer2.name).toEqual('Bob Johnson');

    // Verify both are in database
    const allCustomers = await db.select().from(customersTable).execute();
    expect(allCustomers).toHaveLength(2);
  });

  it('should handle special characters in input fields', async () => {
    const specialInput: CreateCustomerInput = {
      name: "O'Connor & Associates",
      email: 'test+tag@domain-name.co.uk',
      phone: '+1 (555) 123-4567 ext. 890',
      address: '123 "Quote" St, Apt #5B\nCity, ST 12345'
    };

    const result = await createCustomer(specialInput);

    expect(result.name).toEqual("O'Connor & Associates");
    expect(result.email).toEqual('test+tag@domain-name.co.uk');
    expect(result.phone).toEqual('+1 (555) 123-4567 ext. 890');
    expect(result.address).toEqual('123 "Quote" St, Apt #5B\nCity, ST 12345');

    // Verify persistence with special characters
    const savedCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(savedCustomer[0].name).toEqual("O'Connor & Associates");
    expect(savedCustomer[0].address).toContain('\n');
  });

  it('should generate sequential created_at timestamps', async () => {
    const customer1 = await createCustomer({
      name: 'Customer 1',
      email: 'customer1@example.com',
      phone: '+1111111111',
      address: 'Address 1'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const customer2 = await createCustomer({
      name: 'Customer 2',
      email: 'customer2@example.com',
      phone: '+2222222222',
      address: 'Address 2'
    });

    expect(customer1.created_at).toBeInstanceOf(Date);
    expect(customer2.created_at).toBeInstanceOf(Date);
    expect(customer2.created_at.getTime()).toBeGreaterThanOrEqual(customer1.created_at.getTime());
  });
});
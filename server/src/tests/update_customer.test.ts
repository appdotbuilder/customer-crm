import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type UpdateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test data for creating initial customers
const initialCustomer: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  address: '123 Main St'
};

const anotherCustomer: CreateCustomerInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-5678',
  address: '456 Oak Ave'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all customer fields', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Updated Name',
      email: 'updated@example.com',
      phone: '555-9999',
      address: '789 Updated St'
    };

    const result = await updateCustomer(updateInput);

    // Verify returned data
    expect(result.id).toEqual(createdCustomer.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual('555-9999');
    expect(result.address).toEqual('789 Updated St');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdCustomer.created_at);
  });

  it('should update only provided fields', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Partially Updated Name',
      email: 'partial@example.com'
      // phone and address not provided
    };

    const result = await updateCustomer(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(createdCustomer.id);
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.email).toEqual('partial@example.com');
    expect(result.phone).toEqual(initialCustomer.phone); // Unchanged
    expect(result.address).toEqual(initialCustomer.address); // Unchanged
    expect(result.created_at).toEqual(createdCustomer.created_at);
  });

  it('should update single field only', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      phone: '555-0000' // Only phone updated
    };

    const result = await updateCustomer(updateInput);

    // Verify only phone was updated
    expect(result.id).toEqual(createdCustomer.id);
    expect(result.name).toEqual(initialCustomer.name); // Unchanged
    expect(result.email).toEqual(initialCustomer.email); // Unchanged
    expect(result.phone).toEqual('555-0000'); // Updated
    expect(result.address).toEqual(initialCustomer.address); // Unchanged
    expect(result.created_at).toEqual(createdCustomer.created_at);
  });

  it('should save updated customer to database', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Database Updated Name',
      email: 'db@example.com'
    };

    await updateCustomer(updateInput);

    // Verify changes were saved to database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Database Updated Name');
    expect(customers[0].email).toEqual('db@example.com');
    expect(customers[0].phone).toEqual(initialCustomer.phone); // Unchanged
    expect(customers[0].address).toEqual(initialCustomer.address); // Unchanged
    expect(customers[0].created_at).toEqual(createdCustomer.created_at);
  });

  it('should return unchanged customer when no fields provided', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id
      // No fields to update
    };

    const result = await updateCustomer(updateInput);

    // Should return original customer unchanged
    expect(result).toEqual(createdCustomer);

    // Verify database was not modified
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(customers[0]).toEqual(createdCustomer);
  });

  it('should throw error for non-existent customer', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 999, // Non-existent ID
      name: 'Updated Name'
    };

    expect(updateCustomer(updateInput)).rejects.toThrow(/customer with id 999 not found/i);
  });

  it('should not affect other customers', async () => {
    // Create two customers
    const [customer1] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    const [customer2] = await db.insert(customersTable)
      .values(anotherCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: customer1.id,
      name: 'Updated Customer 1'
    };

    await updateCustomer(updateInput);

    // Verify customer2 was not affected
    const unchangedCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer2.id))
      .execute();

    expect(unchangedCustomer[0]).toEqual(customer2);
    expect(unchangedCustomer[0].name).toEqual(anotherCustomer.name);
  });

  it('should handle edge case updates correctly', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(initialCustomer)
      .returning()
      .execute();

    // Update with empty strings (valid but edge case)
    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'A', // Minimal valid name
      email: 'a@b.co', // Minimal valid email
      phone: '1', // Minimal valid phone
      address: 'X' // Minimal valid address
    };

    const result = await updateCustomer(updateInput);

    expect(result.name).toEqual('A');
    expect(result.email).toEqual('a@b.co');
    expect(result.phone).toEqual('1');
    expect(result.address).toEqual('X');
  });
});
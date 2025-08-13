import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type SearchCustomersInput } from '../schema';
import { searchCustomers } from '../handlers/search_customers';

describe('searchCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test customers before each test
  const setupTestCustomers = async () => {
    await db.insert(customersTable)
      .values([
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '123-456-7890',
          address: '123 Main St, Anytown, USA'
        },
        {
          name: 'Jane Doe',
          email: 'jane.doe@company.com',
          phone: '987-654-3210',
          address: '456 Oak Ave, Somewhere, USA'
        },
        {
          name: 'Bob Johnson',
          email: 'bob@testmail.org',
          phone: '555-123-4567',
          address: '789 Pine Rd, Elsewhere, USA'
        },
        {
          name: 'Alice Cooper',
          email: 'alice.cooper@music.com',
          phone: '444-555-6666',
          address: '321 Rock St, Detroit, MI'
        }
      ])
      .execute();
  };

  it('should find customers by name (case-insensitive)', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'john'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(2); // John Smith and Bob Johnson
    expect(results.some(customer => customer.name === 'John Smith')).toBe(true);
    expect(results.some(customer => customer.name === 'Bob Johnson')).toBe(true);
  });

  it('should find customers by email (case-insensitive)', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'company.com'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Jane Doe');
    expect(results[0].email).toBe('jane.doe@company.com');
  });

  it('should handle partial matches in name', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'Smith'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('John Smith');
  });

  it('should handle partial matches in email', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'example'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('john.smith@example.com');
  });

  it('should return empty array when no matches found', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'nonexistent'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(0);
  });

  it('should handle uppercase search query', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'JANE'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Jane Doe');
  });

  it('should handle mixed case search query', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'CoOpEr'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Alice Cooper');
  });

  it('should return all fields for found customers', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'Alice'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    const customer = results[0];
    
    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Alice Cooper');
    expect(customer.email).toBe('alice.cooper@music.com');
    expect(customer.phone).toBe('444-555-6666');
    expect(customer.address).toBe('321 Rock St, Detroit, MI');
    expect(customer.created_at).toBeInstanceOf(Date);
  });

  it('should search in empty database gracefully', async () => {
    // Don't setup test customers - leave database empty

    const input: SearchCustomersInput = {
      query: 'anyone'
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(0);
  });

  it('should handle single character search', async () => {
    await setupTestCustomers();

    const input: SearchCustomersInput = {
      query: 'o'
    };

    const results = await searchCustomers(input);

    // Should find customers with 'o' in name or email
    expect(results.length).toBeGreaterThan(0);
    results.forEach(customer => {
      const hasOInName = customer.name.toLowerCase().includes('o');
      const hasOInEmail = customer.email.toLowerCase().includes('o');
      expect(hasOInName || hasOInEmail).toBe(true);
    });
  });
});
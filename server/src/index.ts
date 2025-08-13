import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createCustomerInputSchema,
  updateCustomerInputSchema,
  searchCustomersInputSchema,
  getCustomerInputSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { getRecentCustomers } from './handlers/get_recent_customers';
import { getCustomer } from './handlers/get_customer';
import { updateCustomer } from './handlers/update_customer';
import { searchCustomers } from './handlers/search_customers';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer management routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),

  getCustomers: publicProcedure
    .query(() => getCustomers()),

  getRecentCustomers: publicProcedure
    .query(() => getRecentCustomers()),

  getCustomer: publicProcedure
    .input(getCustomerInputSchema)
    .query(({ input }) => getCustomer(input)),

  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),

  searchCustomers: publicProcedure
    .input(searchCustomersInputSchema)
    .query(({ input }) => searchCustomers(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
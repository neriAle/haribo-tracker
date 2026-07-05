import { vi, beforeEach } from "vitest";

// 1. Create a chainable mock for Drizzle's CRUD operations
const chainableDbMock = {
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

// 2. Global Database Mock
vi.mock("../db/index.ts", () => ({
  db: {
    query: {
      packets: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      categories: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => chainableDbMock),
    update: vi.fn(() => chainableDbMock),
    delete: vi.fn(() => chainableDbMock),
  },
}));

// 3. Global Logger Mock
vi.mock("../lib/logger.ts", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 4. Mock astro:middleware (virtual module)
vi.mock("astro:middleware", () => ({
  defineMiddleware: vi.fn((fn) => fn),
}));

// 5. Automatically clear mocks before every single test
beforeEach(() => {
  vi.clearAllMocks();
});

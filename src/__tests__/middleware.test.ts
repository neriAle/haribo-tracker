/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequest } from "../middleware";

describe("Auth Middleware", () => {
  let mockNext: any;

  beforeEach(() => {
    import.meta.env.SESSION_SECRET = "super-secret-key";
    mockNext = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
  });

  it("should allow all GET requests to pass through", async () => {
    const mockContext = {
      request: new Request("http://localhost/api/packets", { method: "GET" }),
      url: new URL("http://localhost/api/packets"),
      cookies: { get: vi.fn() },
      locals: {},
    };

    const response = (await onRequest(
      mockContext as any,
      mockNext,
    )) as Response;

    expect(mockNext).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("should block POST requests if no cookie is provided", async () => {
    const mockContext = {
      request: new Request("http://localhost/api/packets", { method: "POST" }),
      url: new URL("http://localhost/api/packets"),
      cookies: { get: vi.fn().mockReturnValue(undefined) },
      locals: {},
    };

    const response = (await onRequest(
      mockContext as any,
      mockNext,
    )) as Response;

    expect(mockNext).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("should block mutations if the cookie value is wrong", async () => {
    const mockContext = {
      request: new Request("http://localhost/api/packets/123", {
        method: "DELETE",
      }),
      url: new URL("http://localhost/api/packets/123"),
      cookies: { get: vi.fn().mockReturnValue({ value: "wrong-password" }) },
      locals: {},
    };

    const response = (await onRequest(
      mockContext as any,
      mockNext,
    )) as Response;

    expect(mockNext).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("should allow mutations if the correct cookie is provided", async () => {
    const mockContext = {
      request: new Request("http://localhost/api/packets", { method: "PUT" }),
      url: new URL("http://localhost/api/packets"),
      cookies: { get: vi.fn().mockReturnValue({ value: "super-secret-key" }) },
      locals: {},
    };

    const response = (await onRequest(
      mockContext as any,
      mockNext,
    )) as Response;

    expect(mockNext).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});

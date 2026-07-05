/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as login } from "../login";
import { POST as logout } from "../logout";

describe("Auth API Endpoints", () => {
  // Setup fresh mock environment variables before each test
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.ADMIN_PASSWORD = "correct-password";
    import.meta.env.SESSION_SECRET = "test-secret-token";
    import.meta.env.PROD = true;
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and set the HTTP-only cookie on correct password", async () => {
      const mockCookies = { set: vi.fn() };
      const request = new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "correct-password" }),
      });

      const response = await login({ request, cookies: mockCookies } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify cookie was set with maximum security flags
      expect(mockCookies.set).toHaveBeenCalledWith(
        "haribo_session",
        "test-secret-token",
        expect.objectContaining({
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        }),
      );
    });

    it("should return 401 Unauthorized on incorrect password", async () => {
      const mockCookies = { set: vi.fn() };
      const request = new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "wrong-password" }),
      });

      const response = await login({ request, cookies: mockCookies } as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid password");

      // Ensure the cookie was NOT set
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it("should return 400 Bad Request if the JSON payload is malformed", async () => {
      const mockCookies = { set: vi.fn() };
      // Passing plain text instead of JSON to intentionally crash `request.json()`
      const request = new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "this is not valid json",
      });

      const response = await login({ request, cookies: mockCookies } as any);

      expect(response.status).toBe(400);
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should return 200 and delete the session cookie", async () => {
      const mockCookies = { delete: vi.fn() };

      const response = await logout({ cookies: mockCookies } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify the cookie deletion method was called for the root path
      expect(mockCookies.delete).toHaveBeenCalledWith("haribo_session", {
        path: "/",
      });
    });
  });
});

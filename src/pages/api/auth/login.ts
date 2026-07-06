import type { APIRoute } from "astro";

type CloudflareRuntime = { env: Record<string, string> };

/**
 * Path:     POST /api/auth/login
 * Params:   Body { password: string }
 * Returns:  200 OK { success: true } (Includes Set-Cookie header)
 *           401 Unauthorized { error: string }
 *           400 Bad Request { error: string }
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();

    const runtime = (locals as App.Locals & { runtime?: CloudflareRuntime })
      .runtime;
    const env = runtime?.env ?? import.meta.env;
    const adminPassword = env.ADMIN_PASSWORD;
    const sessionSecret = env.SESSION_SECRET;

    if (body.password === adminPassword) {
      cookies.set("haribo_session", sessionSecret, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      status: 400,
    });
  }
};

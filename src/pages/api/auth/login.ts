import type { APIRoute } from "astro";

/**
 * Path:     POST /api/auth/login
 * Params:   Body { password: string }
 * Returns:  200 OK { success: true } (Includes Set-Cookie header)
 *           401 Unauthorized { error: string }
 *           400 Bad Request { error: string }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    if (body.password === import.meta.env.ADMIN_PASSWORD) {
      cookies.set("haribo_session", import.meta.env.SESSION_SECRET, {
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

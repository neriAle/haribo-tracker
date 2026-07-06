import type { APIRoute } from "astro";
// @ts-expect-error - Virtual module provided by Cloudflare adapter
import { env as cfEnv } from "cloudflare:workers";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    const adminPassword =
      cfEnv?.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD;
    const sessionSecret =
      cfEnv?.SESSION_SECRET ?? import.meta.env.SESSION_SECRET;

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

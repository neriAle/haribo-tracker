import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
  // Delete the session cookie by setting its maxAge to 0
  cookies.delete("haribo_session", { path: "/" });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

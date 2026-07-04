import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const { url, request, cookies } = context;

  // 1. Define what needs protection
  const isApi = url.pathname.startsWith("/api/");
  const isAuthRoute = url.pathname.startsWith("/api/auth/");
  const isWriteMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(
    request.method,
  );
  const isProtectedUIPage =
    url.pathname.startsWith("/add") || url.pathname.startsWith("/edit");

  // 2. If it's a write API (excluding the login route) OR a protected UI page
  if ((isApi && isWriteMethod && !isAuthRoute) || isProtectedUIPage) {
    const sessionCookie = cookies.get("haribo_session");

    // 3. Verify the cookie value matches the session secret
    if (sessionCookie?.value !== import.meta.env.SESSION_SECRET) {
      if (isApi) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // If a user navigates to /add without a cookie, redirect to /login
      return context.redirect("/login");
    }
  }

  // 4. If all checks pass, proceed to the destination
  return next();
});

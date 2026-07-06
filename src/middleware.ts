import { defineMiddleware } from "astro:middleware";
import { logger } from "./lib/logger";
// @ts-expect-error - Virtual module provided by Cloudflare adapter
import { env as cfEnv } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies } = context;
  const startTime = Date.now();

  // Pull from Cloudflare at runtime, fallback to local env for dev/tests
  const sessionSecret = cfEnv?.SESSION_SECRET ?? import.meta.env.SESSION_SECRET;

  // 1. Define what needs protection
  const isApi = url.pathname.startsWith("/api/");
  const isAuthRoute = url.pathname.startsWith("/api/auth/");
  const isWriteMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(
    request.method,
  );
  const isProtectedUIPage =
    url.pathname.startsWith("/add") || url.pathname.startsWith("/edit");

  // 2. Auth Check
  if ((isApi && isWriteMethod && !isAuthRoute) || isProtectedUIPage) {
    const sessionCookie = cookies.get("haribo_session");

    if (sessionCookie?.value !== sessionSecret) {
      logger.warn("Unauthorized access attempt", { path: url.pathname });

      if (isApi) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/login");
    }
  }

  // 3. Process the actual request
  const response = await next();

  // 4. Log the outcome
  const duration = Date.now() - startTime;

  if (isApi || url.pathname === "/" || isProtectedUIPage) {
    logger.info("Request Processed", {
      method: request.method,
      path: url.pathname,
      status: response.status,
      durationMs: duration,
    });
  }

  return response;
});

import type { APIRoute } from "astro";
import { db } from "../../../db";
import { logger } from "../../../lib/logger";

/**
 * Path:     GET /api/categories
 * Params:   None
 * Returns:  200 OK Array<{ id: number, name: string }>
 *           500 Internal Server Error { error: string }
 */
export const GET: APIRoute = async () => {
  try {
    // Fetch all categories
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.id)],
    });

    return new Response(JSON.stringify(allCategories), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Failed to fetch categories", { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

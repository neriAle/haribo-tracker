import type { APIRoute } from "astro";
import { db } from "../../../db";
import { insertPacketSchema } from "../../../db/validation";
import { packets, packetCategories } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../../lib/logger";
import { z } from "zod";

const idSchema = z.uuid();

/**
 * Path:     GET /api/packets/[id]
 * Params:   URL Param { id: UUID }
 * Returns:  200 OK { id, name, language, imageUrl, rating, comment, ..., categories: Array<{ id, name }> }
 *           400 Bad Request { error: string }
 *           404 Not Found { error: string }
 *           500 Internal Server Error { error: string }
 */
export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const parseResult = idSchema.safeParse(id);
  if (!parseResult.success) {
    logger.warn("Invalid packet ID format requested", { id });
    return new Response(JSON.stringify({ error: "Invalid packet ID format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanId = parseResult.data;

  try {
    const packet = await db.query.packets.findFirst({
      where: (packets, { eq }) => eq(packets.id, cleanId),
      with: {
        packetCategories: {
          with: { category: true },
        },
      },
    });

    if (!packet) {
      return new Response(JSON.stringify({ error: "Packet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { packetCategories, ...rest } = packet;
    const formattedPacket = {
      ...rest,
      categories: packetCategories.map((pc) => pc.category),
    };

    return new Response(JSON.stringify(formattedPacket), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`Failed to fetch packet ${cleanId}`, { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Path:     PUT /api/packets/[id]
 * Params:   URL Param { id: UUID }
 *           Body { name: string, language: string, imageUrl: string, categoryIds: number[], rating: number, comment?: string, dateAcquired?: string, locationAcquired?: string }
 * Returns:  200 OK { success: true }
 *           400 Bad Request { error: string, details?: object }
 *           404 Not Found { error: string }
 *           500 Internal Server Error { error: string }
 */
export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;

  // 1. Sanitize ID
  const parseIdResult = idSchema.safeParse(id);
  if (!parseIdResult.success) {
    return new Response(JSON.stringify({ error: "Invalid packet ID format" }), {
      status: 400,
    });
  }
  const cleanId = parseIdResult.data;

  try {
    const body = await request.json();

    // 2. Validate incoming payload
    const parseResult = insertPacketSchema.safeParse(body);
    if (!parseResult.success) {
      const formattedErrors = z.treeifyError(parseResult.error);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: formattedErrors,
        }),
        { status: 400 },
      );
    }

    const { categoryIds, ...packetData } = parseResult.data;

    // 3. Attempt the UPDATE and capture the result
    const updatedPacket = await db
      .update(packets)
      .set(packetData)
      .where(eq(packets.id, cleanId))
      .returning({ id: packets.id });

    // 4. If the array is empty, the packet never existed
    if (updatedPacket.length === 0) {
      logger.warn(`Attempted to update non-existent packet`, { id: cleanId });
      return new Response(JSON.stringify({ error: "Packet not found" }), {
        status: 404,
      });
    }

    // 5. Sync the Junction Table (Categories)
    // First, delete all existing relations for this packet
    await db
      .delete(packetCategories)
      .where(eq(packetCategories.packetId, cleanId));

    // Then, insert the new relations (if any were provided)
    if (categoryIds.length > 0) {
      const junctionInserts = categoryIds.map((categoryId) => ({
        packetId: cleanId,
        categoryId: categoryId,
      }));
      await db.insert(packetCategories).values(junctionInserts);
    }

    logger.info(`Packet updated successfully`, { id: cleanId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`Failed to update packet ${cleanId}`, { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};

/**
 * Path:     DELETE /api/packets/[id]
 * Params:   URL Param { id: UUID }
 * Returns:  200 OK { success: true }
 *           400 Bad Request { error: string }
 *           404 Not Found { error: string }
 *           500 Internal Server Error { error: string }
 */
export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;

  // 1. Sanitize ID
  const parseIdResult = idSchema.safeParse(id);
  if (!parseIdResult.success) {
    logger.warn("Invalid packet ID format for deletion", { id });
    return new Response(JSON.stringify({ error: "Invalid packet ID format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanId = parseIdResult.data;

  try {
    // 2. Clean up junction table first to prevent orphaned data
    await db
      .delete(packetCategories)
      .where(eq(packetCategories.packetId, cleanId));

    // 3. Attempt the DELETE on the main table and capture the result
    const deletedPacket = await db
      .delete(packets)
      .where(eq(packets.id, cleanId))
      .returning({ id: packets.id });

    // 4. If the array is empty, the packet never existed
    if (deletedPacket.length === 0) {
      logger.warn(`Attempted to delete non-existent packet`, { id: cleanId });
      return new Response(JSON.stringify({ error: "Packet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    logger.info(`Packet deleted successfully`, { id: cleanId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`Failed to delete packet ${cleanId}`, { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

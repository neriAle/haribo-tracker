/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIRoute } from "astro";
import { z } from "zod";
import { db } from "../../../db";
import { insertPacketSchema } from "../../../db/validation";
import { packets, packetCategories } from "../../../db/schema";
import { logger } from "../../../lib/logger";

/**
 * Path:     GET /api/packets
 * Params:   None
 * Returns:  200 OK Array<{ id, name, language, imageUrl, rating, comment, ..., categories: Array<{ id, name }> }>
 *           500 Internal Server Error { error: string }
 */
export const GET: APIRoute = async () => {
  try {
    const rawPackets = await db.query.packets.findMany({
      with: {
        packetCategories: { with: { category: true } },
      },
      orderBy: (packets, { desc }) => [desc(packets.createdAt)],
    });

    const formattedPackets = rawPackets.map((packet) => {
      const { packetCategories, ...rest } = packet;
      return {
        ...rest,
        categories: packetCategories.map((pc) => pc.category),
      };
    });

    return new Response(JSON.stringify(formattedPackets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Failed to fetch all packets", { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Path:     POST /api/packets
 * Params:   Body { name: string, language: string, imageUrl: string, categoryIds: number[], rating: number, comment?: string, dateAcquired?: string, locationAcquired?: string }
 * Returns:  201 Created { success: true, id: string }
 *           400 Bad Request { error: string, details: object }
 *           500 Internal Server Error { error: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // 1. Validate incoming data with Zod
    const parseResult = insertPacketSchema.safeParse(body);
    if (!parseResult.success) {
      const formattedErrors = z.treeifyError(parseResult.error);
      logger.warn("Invalid packet POST payload", {
        errors: formattedErrors,
      });
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: formattedErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = parseResult.data;

    // 2. Insert the main packet and return its new auto-generated UUID
    const { categoryIds, ...packetData } = data;

    const [newPacket] = await db
      .insert(packets)
      .values({
        name: packetData.name,
        language: packetData.language,
        imageUrl: packetData.imageUrl,
        dateAcquired: packetData.dateAcquired,
        locationAcquired: packetData.locationAcquired,
        rating: packetData.rating,
        comment: packetData.comment,
      })
      .returning({ id: packets.id });

    // 3. Map the array of numbers into an array of objects for the junction table
    const junctionInserts = categoryIds.map((categoryId) => ({
      packetId: newPacket.id,
      categoryId: categoryId,
    }));

    // 4. Bulk insert the category relations
    await db.insert(packetCategories).values(junctionInserts);

    logger.info(`New packet created successfully`, { id: newPacket.id });

    return new Response(JSON.stringify({ success: true, id: newPacket.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    // Intercept SQLite unique constraint errors
    if (error?.message?.includes("UNIQUE constraint failed: packets.name")) {
      return new Response(
        JSON.stringify({
          error:
            "Esiste già un pacchetto con questo nome. Usa un nome univoco (es. aggiungi '- EN').",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    logger.error("Failed to create packet", { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

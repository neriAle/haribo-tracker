import type { APIRoute } from "astro";
import { db } from "../../../db";
import { logger } from "../../../lib/logger";
import { z } from "zod";

const idSchema = z.uuid();

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

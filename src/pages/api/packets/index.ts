import type { APIRoute } from "astro";
import { db } from "../../../db";
import { logger } from "../../../lib/logger";

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

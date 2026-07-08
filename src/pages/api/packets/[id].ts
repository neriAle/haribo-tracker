/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIRoute } from "astro";
import { AwsClient } from "aws4fetch";
import { db } from "../../../db";
import { insertPacketSchema } from "../../../db/validation";
import { packets, packetCategories } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../../lib/logger";
import { z } from "zod";
// @ts-expect-error - Virtual module provided by Cloudflare adapter
import { env as cfEnv } from "cloudflare:workers";

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
      /* v8 ignore next */
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
    /* v8 ignore next */
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

    // 3. Fetch the existing packet to compare the image URL
    const [existingPacket] = await db
      .select({ imageUrl: packets.imageUrl })
      .from(packets)
      .where(eq(packets.id, cleanId));

    if (!existingPacket) {
      return new Response(JSON.stringify({ error: "Packet not found" }), {
        status: 404,
      });
    }

    // 4. If the image URL has changed, wipe the old one from R2
    if (existingPacket.imageUrl !== packetData.imageUrl) {
      try {
        const url = new URL(existingPacket.imageUrl);
        const fileKey = url.pathname.substring(
          url.pathname.lastIndexOf("/") + 1,
        );

        const accessKeyId =
          cfEnv?.R2_ACCESS_KEY_ID ?? import.meta.env.R2_ACCESS_KEY_ID;
        const secretAccessKey =
          cfEnv?.R2_SECRET_ACCESS_KEY ?? import.meta.env.R2_SECRET_ACCESS_KEY;
        const endpoint = cfEnv?.R2_ENDPOINT ?? import.meta.env.R2_ENDPOINT;
        const bucketName =
          cfEnv?.R2_BUCKET_NAME ?? import.meta.env.R2_BUCKET_NAME;

        if (accessKeyId && secretAccessKey && endpoint && bucketName) {
          const aws = new AwsClient({
            accessKeyId,
            secretAccessKey,
            service: "s3",
            region: "auto",
          });

          const bucketUrl = `${endpoint}/${bucketName}/${fileKey}`;

          const deleteResponse = await aws.fetch(bucketUrl, {
            method: "DELETE",
          });

          if (deleteResponse.ok) {
            logger.info(`Deleted orphaned image from R2`, { fileKey });
          } else {
            logger.warn(`Failed to delete orphaned image from R2`, {
              status: deleteResponse.status,
              fileKey,
            });
          }
        /* v8 ignore next */
        } else {
          logger.warn("Missing R2 credentials, skipping image deletion");
        }
      } catch (error) {
        logger.error(`Error attempting to delete old image from R2`, { error });
      }
    }

    packetData.language = packetData.language?.toUpperCase();

    // 5. Attempt the UPDATE and capture the result
    await db
      .update(packets)
      .set(packetData)
      .where(eq(packets.id, cleanId))
      .returning({ id: packets.id });

    // 6. Sync the Junction Table (Categories)
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

    logger.error(`Failed to update packet ${cleanId}`, { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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

    // 3. Attempt the DELETE on the main table and capture both ID and imageUrl
    const deletedPacket = await db
      .delete(packets)
      .where(eq(packets.id, cleanId))
      .returning({ id: packets.id, imageUrl: packets.imageUrl });

    // 4. If the array is empty, the packet never existed
    if (deletedPacket.length === 0) {
      logger.warn(`Attempted to delete non-existent packet`, { id: cleanId });
      return new Response(JSON.stringify({ error: "Packet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Delete the associated image from R2
    const { imageUrl } = deletedPacket[0];
    if (imageUrl) {
      try {
        const url = new URL(imageUrl);
        const fileKey = url.pathname.substring(
          url.pathname.lastIndexOf("/") + 1,
        );

        const accessKeyId =
          cfEnv?.R2_ACCESS_KEY_ID ?? import.meta.env.R2_ACCESS_KEY_ID;
        const secretAccessKey =
          cfEnv?.R2_SECRET_ACCESS_KEY ?? import.meta.env.R2_SECRET_ACCESS_KEY;
        const endpoint = cfEnv?.R2_ENDPOINT ?? import.meta.env.R2_ENDPOINT;
        const bucketName =
          cfEnv?.R2_BUCKET_NAME ?? import.meta.env.R2_BUCKET_NAME;

        if (accessKeyId && secretAccessKey && endpoint && bucketName) {
          const aws = new AwsClient({
            accessKeyId,
            secretAccessKey,
            service: "s3",
            region: "auto",
          });

          const bucketUrl = `${endpoint}/${bucketName}/${fileKey}`;

          const deleteResponse = await aws.fetch(bucketUrl, {
            method: "DELETE",
          });

          if (deleteResponse.ok) {
            logger.info(`Deleted image from R2`, { fileKey });
          } else {
            logger.warn(`Failed to delete image from R2`, {
              status: deleteResponse.status,
              fileKey,
            });
          }
        } else {
          logger.warn("Missing R2 credentials, skipping image deletion");
        }
      } catch (error) {
        logger.error(`Error attempting to delete image from R2`, { error });
      }
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

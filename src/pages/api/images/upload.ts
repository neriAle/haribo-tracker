import type { APIRoute } from "astro";
import { AwsClient } from "aws4fetch";
import { logger } from "../../../lib/logger";
import { z } from "zod";
// @ts-expect-error - Virtual module provided by Cloudflare adapter
import { env as cfEnv } from "cloudflare:workers";

const uploadSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"], {
    message: "Invalid or unsupported image type",
  }),
});

/**
 * Path:     POST /api/images/upload
 * Params:   Body { contentType: string }
 * Returns:  200 OK { uploadUrl: string, publicUrl: string }
 *           400 Bad Request { error: string }
 *           500 Internal Server Error { error: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const parseResult = uploadSchema.safeParse(body);
    if (!parseResult.success) {
      const formattedErrors = z.treeifyError(parseResult.error);
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: formattedErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { contentType } = parseResult.data;

    const accessKeyId =
      cfEnv?.R2_ACCESS_KEY_ID ?? import.meta.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      cfEnv?.R2_SECRET_ACCESS_KEY ?? import.meta.env.R2_SECRET_ACCESS_KEY;
    const endpoint = cfEnv?.R2_ENDPOINT ?? import.meta.env.R2_ENDPOINT;
    const bucketName = cfEnv?.R2_BUCKET_NAME ?? import.meta.env.R2_BUCKET_NAME;
    const publicUrl = cfEnv?.R2_PUBLIC_URL ?? import.meta.env.R2_PUBLIC_URL;

    // Initialize client dynamically inside the request
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    const fileExtension = contentType.split("/")[1];
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const bucketUrl = `${endpoint}/${bucketName}/${fileName}`;

    const signedRequest = await aws.sign(bucketUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      aws: { signQuery: true },
    });

    const finalPublicUrl = `${publicUrl}/${fileName}`;
    logger.info("Generated R2 presigned URL natively", { fileName });

    return new Response(
      JSON.stringify({
        uploadUrl: signedRequest.url,
        publicUrl: finalPublicUrl,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    logger.error("Failed to generate presigned URL", { error });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

import type { APIRoute } from "astro";
import { AwsClient } from "aws4fetch";
import { logger } from "../../../lib/logger";
import { z } from "zod";

// Ensure the frontend only uploads standard web images
const uploadSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"], {
    message: "Invalid or unsupported image type",
  }),
});

// Initialize the edge-native AWS client
const aws = new AwsClient({
  accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
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

    // Generate a unique filename
    const fileExtension = contentType.split("/")[1];
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Construct the full destination URL for R2
    const bucketUrl = `${import.meta.env.R2_ENDPOINT}/${import.meta.env.R2_BUCKET_NAME}/${fileName}`;

    // Generate the presigned URL, signing the specific Content-Type header
    const signedRequest = await aws.sign(bucketUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      aws: { signQuery: true },
    });

    const finalPublicUrl = `${import.meta.env.R2_PUBLIC_URL}/${fileName}`;

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

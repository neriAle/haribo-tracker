/* eslint-disable @typescript-eslint/no-explicit-any */
export const uploadImageToR2 = async (blob: Blob): Promise<string> => {
  const signRes = await fetch("/api/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: "image/webp" }),
  });

  if (!signRes.ok) throw new Error("Failed to get upload authorization");
  const { uploadUrl, publicUrl } = await signRes.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/webp" },
    body: blob,
  });

  if (!uploadRes.ok) throw new Error("Failed to upload image to storage");

  return publicUrl;
};

export const savePacket = async (
  payload: any,
  isEdit: boolean,
  id?: string,
) => {
  const url = isEdit ? `/api/packets/${id}` : "/api/packets";
  const method = isEdit ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Errore durante il salvataggio.");
  }
};

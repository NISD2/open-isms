import { z } from "zod";
import type { RecraftRequest } from "./prompt";

/** The only host the API token is ever sent to. */
const GENERATIONS_URL = "https://external.api.recraft.ai/v1/images/generations";

const GenerationResponse = z.object({
  data: z.array(z.object({ url: z.url({ protocol: /^https$/ }) })).min(1),
});

/** Generates one image and returns the SVG text. The download carries no credentials. */
export async function generateSvg(
  token: string,
  request: RecraftRequest,
): Promise<string> {
  const response = await fetch(GENERATIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Recraft answered ${response.status}: ${JSON.stringify(body)}`);
  }

  const parsed = GenerationResponse.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Recraft returned an unexpected body: ${parsed.error.message}`);
  }
  const [image] = parsed.data.data;
  if (!image) throw new Error("Recraft returned no image");

  const download = await fetch(image.url);
  if (!download.ok) throw new Error(`Downloading the image failed: ${download.status}`);
  return download.text();
}

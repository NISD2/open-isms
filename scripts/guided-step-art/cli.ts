/**
 * Illustrations for the Durchgang steps, in the brand, as animated SVG.
 *
 *   bun scripts/guided-step-art/cli.ts prompt "<subject>"            themed prompt only
 *   bun scripts/guided-step-art/cli.ts prompt "<subject>" --json     the full API request
 *   bun scripts/guided-step-art/cli.ts generate "<subject>" -o out.svg
 *   bun scripts/guided-step-art/cli.ts animate in.svg -o out.svg     theme an SVG you already have
 *
 * `generate` needs RECRAFT_API_TOKEN (recraft.ai, Profile, API). API units are a separate
 * balance from the web subscription and must be bought before a token can be created.
 * `prompt` and `animate` need nothing, so an image made in the Recraft app or through its
 * MCP server gets the same prompt and the same finish.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { GUIDED_STEP_ART } from "@/design/guided-step-art";
import { animateSvg } from "./animate-svg";
import { type Brand, loadBrand } from "./brand-tokens";
import { allowedColors, composePrompt, recraftRequest } from "./prompt";
import { generateSvg } from "./recraft";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Outcome = { ok: true; stdout: string } | { ok: false; error: string };

const finish = (brand: Brand, svg: string) =>
  animateSvg(svg, {
    palette: allowedColors(brand),
    background: brand.colors[GUIDED_STEP_ART.background],
    backdrop: {
      color: brand.colors[GUIDED_STEP_ART.backdrop.color],
      radius: GUIDED_STEP_ART.backdrop.radius,
    },
    easing: brand.easing,
    motion: GUIDED_STEP_ART.motion,
  });

async function save(path: string, svg: string): Promise<Outcome> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, svg);
  return { ok: true, stdout: `Wrote ${path}` };
}

async function run(): Promise<Outcome> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { out: { type: "string", short: "o" }, json: { type: "boolean" } },
  });
  const [command, input] = positionals;
  if (!command || !input)
    return { ok: false, error: "Usage: see the header of this file" };

  const brand = await loadBrand(REPO_ROOT);

  if (command === "prompt") {
    const stdout = values.json
      ? JSON.stringify(recraftRequest(input, brand), null, 2)
      : composePrompt(input, brand);
    return { ok: true, stdout };
  }
  if (!values.out) return { ok: false, error: `${command} needs --out <file.svg>` };

  if (command === "animate") {
    return save(values.out, finish(brand, await readFile(input, "utf8")));
  }
  if (command === "generate") {
    const token = process.env.RECRAFT_API_TOKEN?.trim();
    if (!token) return { ok: false, error: "RECRAFT_API_TOKEN is not set" };
    return save(
      values.out,
      finish(brand, await generateSvg(token, recraftRequest(input, brand))),
    );
  }
  return { ok: false, error: `Unknown command ${command}` };
}

const outcome = await run().catch(
  (error: unknown): Outcome => ({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }),
);
if (outcome.ok) console.log(outcome.stdout);
else console.error(outcome.error);
process.exit(outcome.ok ? 0 : 1);

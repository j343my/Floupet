/**
 * One-shot bulk import from Open Pet Food Facts
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/import-opff.ts
 *
 * The script downloads the OPFF JSONL data dump, parses it line by line,
 * and upserts pet food products into Supabase.
 *
 * Download size: ~200MB compressed. Only products with a barcode and a name are imported.
 */

import { createClient } from "@supabase/supabase-js";
import { createGunzip } from "zlib";
import { createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { createInterface } from "readline";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";
import https from "https";

const OPFF_DUMP_URL =
    "https://world.openpetfoodfacts.org/data/en.openpetfoodfacts.org.products.jsonl.gz";
const BATCH_SIZE = 100;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ProductType = "kibble" | "wet_food" | "pouch" | "treat" | "other";

function inferProductType(categories: string[]): ProductType {
    const joined = categories.join(" ").toLowerCase();
    if (/dry|kibble|croquette|sec/.test(joined)) return "kibble";
    if (/pouch|sachet/.test(joined)) return "pouch";
    if (/wet|pate|patee|humide|mousse/.test(joined)) return "wet_food";
    if (/treat|friandise|snack/.test(joined)) return "treat";
    return "other";
}

function mapLine(raw: any) {
    const barcode: string = raw.code?.trim();
    const name: string = (
        raw.product_name ||
        raw.product_name_fr ||
        raw.product_name_en ||
        ""
    ).trim();

    if (!barcode || !name) return null;

    const categories: string[] = raw.categories_tags ?? [];
    const quantity = raw.product_quantity ?? null;
    const net_weight_g = quantity ? parseFloat(quantity) || null : null;
    const kcal_per_100g = raw.nutriments?.["energy-kcal_100g"] ?? null;
    const brands: string = raw.brands ?? "";
    const brand = brands ? brands.split(",")[0].trim() : null;

    return {
        barcode,
        name,
        brand: brand || null,
        product_type: inferProductType(categories),
        net_weight_g,
        grams_per_unit: null,
        kcal_per_100g,
        photo_url: raw.image_front_url ?? null,
        verified: true,
        created_by: null,
    };
}

async function downloadDump(destPath: string): Promise<void> {
    console.log("Downloading OPFF dump...");
    const tmpGz = destPath + ".gz";

    await new Promise<void>((resolve, reject) => {
        const file = createWriteStream(tmpGz);
        https.get(OPFF_DUMP_URL, (res) => {
            res.pipe(file);
            file.on("finish", () => { file.close(); resolve(); });
        }).on("error", reject);
    });

    console.log("Decompressing...");
    await pipeline(
        createReadStream(tmpGz),
        createGunzip(),
        createWriteStream(destPath)
    );
    await unlink(tmpGz);
    console.log("Download complete.");
}

async function upsertBatch(batch: any[]): Promise<number> {
    const { error, count } = await supabase
        .from("products")
        .upsert(batch, { onConflict: "barcode", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true });

    if (error) {
        console.error("Batch error:", error.message);
        return 0;
    }
    return count ?? batch.length;
}

async function main() {
    const jsonlPath = join(tmpdir(), "opff-products.jsonl");

    await downloadDump(jsonlPath);

    const rl = createInterface({ input: createReadStream(jsonlPath), crlfDelay: Infinity });

    let batch: any[] = [];
    let total = 0;
    let skipped = 0;
    let inserted = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;
        total++;

        let raw: any;
        try { raw = JSON.parse(line); } catch { skipped++; continue; }

        const mapped = mapLine(raw);
        if (!mapped) { skipped++; continue; }

        batch.push(mapped);

        if (batch.length >= BATCH_SIZE) {
            inserted += await upsertBatch(batch);
            batch = [];
            process.stdout.write(`\r  Processed: ${total} | Inserted: ${inserted} | Skipped: ${skipped}`);
        }
    }

    if (batch.length > 0) {
        inserted += await upsertBatch(batch);
    }

    await unlink(jsonlPath);

    console.log(`\n\nDone.`);
    console.log(`  Total lines : ${total}`);
    console.log(`  Inserted    : ${inserted}`);
    console.log(`  Skipped     : ${skipped}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

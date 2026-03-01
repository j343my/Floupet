import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { ProductType } from "@/types";

function mapOpffToProduct(opff: any, barcode: string) {
    const categories: string[] = opff.categories_tags ?? [];

    let product_type: ProductType = "other";
    if (categories.some((c: string) => /dry|kibble|croquette/i.test(c))) {
        product_type = "kibble";
    } else if (categories.some((c: string) => /pouch|sachet/i.test(c))) {
        product_type = "pouch";
    } else if (categories.some((c: string) => /wet|pate|patee|humide/i.test(c))) {
        product_type = "wet_food";
    } else if (categories.some((c: string) => /treat|friandise|snack/i.test(c))) {
        product_type = "treat";
    }

    const quantity = opff.product_quantity ?? opff.quantity ?? null;
    const net_weight_g = quantity ? parseFloat(quantity) || null : null;

    return {
        barcode,
        name: opff.product_name || opff.product_name_fr || opff.product_name_en || null,
        brand: opff.brands ? opff.brands.split(",")[0].trim() : null,
        product_type,
        net_weight_g,
        grams_per_unit: null,
        kcal_per_100g: opff.nutriments?.["energy-kcal_100g"] ?? null,
        photo_url: opff.image_front_url ?? null,
        verified: true,
        created_by: null,
    };
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode")?.trim();

    if (!barcode) {
        return NextResponse.json({ error: "Paramètre barcode manquant" }, { status: 400 });
    }

    // 1. Check local DB first
    const { data: existing } = await supabase
        .from("products")
        .select("id, name, brand, product_type, grams_per_unit, net_weight_g, kcal_per_100g, verified, photo_url, barcode")
        .eq("barcode", barcode)
        .is("deleted_at", null)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ product: existing, source: "db" });
    }

    // 2. Call Open Pet Food Facts API
    let opffData: any = null;
    try {
        const res = await fetch(
            `https://world.openpetfoodfacts.org/api/v2/product/${barcode}.json`,
            { headers: { "User-Agent": "Floupet/1.0 (contact@floupet.app)" }, next: { revalidate: 0 } }
        );
        if (res.ok) {
            const json = await res.json();
            if (json.status === 1 && json.product) {
                opffData = json.product;
            }
        }
    } catch {
        // OPFF unavailable, we'll return not found
    }

    if (!opffData) {
        return NextResponse.json({ product: null, source: "none" });
    }

    const mapped = mapOpffToProduct(opffData, barcode);

    if (!mapped.name) {
        return NextResponse.json({ product: null, source: "none" });
    }

    // 3. Save to DB so the next user gets it instantly
    const { data: created, error } = await supabase
        .from("products")
        .insert(mapped)
        .select("id, name, brand, product_type, grams_per_unit, net_weight_g, kcal_per_100g, verified, photo_url, barcode")
        .single();

    if (error) {
        // Concurrent insert race condition — just return the mapped data without id
        return NextResponse.json({ product: mapped, source: "opff" });
    }

    return NextResponse.json({ product: created, source: "opff" });
}

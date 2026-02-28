import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    let query = supabase
        .from('products')
        .select('id, name, brand, product_type, grams_per_unit, net_weight_g, kcal_per_100g, verified, photo_url, barcode')
        .is('deleted_at', null)
        .order('verified', { ascending: false })
        .order('name')
        .limit(10);

    if (q) {
        query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,barcode.eq.${q}`);
    }

    const { data: products, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products });
}

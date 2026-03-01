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

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // validate required fields
        if (!body.name || !body.product_type) {
            return NextResponse.json({ error: "Le nom et le type sont requis" }, { status: 400 });
        }

        const newProduct = {
            barcode: body.barcode || null,
            name: body.name,
            brand: body.brand || null,
            product_type: body.product_type,
            net_weight_g: body.net_weight_g || null,
            grams_per_unit: body.grams_per_unit || null,
            kcal_per_100g: body.kcal_per_100g || null,
            photo_url: body.photo_url || null,
            verified: false, // Always false when proposed by users
            created_by: user.id
        };

        const { data: product, error } = await supabase
            .from('products')
            .insert(newProduct)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ product }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
    }
}

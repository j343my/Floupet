import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId');
    const petId = searchParams.get('petId');
    const dateFrom = searchParams.get('dateFrom'); // ISO date string
    const dateTo = searchParams.get('dateTo');     // ISO date string

    if (!householdId) {
        return NextResponse.json({ error: "Foyer non spécifié" }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('household_id', householdId)
        .single();

    if (!membership) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Build query — join product and giver profile
    let query = supabase
        .from('feed_logs')
        .select(`
            *,
            product:products(id, name, brand, product_type, grams_per_unit, verified, photo_url),
            given_by_profile:profiles!feed_logs_given_by_fkey(id, full_name, avatar_url),
            pet:pets!feed_logs_pet_id_fkey(id, name, species, photo_url)
        `)
        .order('given_at', { ascending: false });

    if (petId) {
        query = query.eq('pet_id', petId);
    } else {
        // Filter to all pets in the household
        const { data: pets } = await supabase
            .from('pets')
            .select('id')
            .eq('household_id', householdId)
            .is('archived_at', null);

        const petIds = pets?.map(p => p.id) ?? [];
        if (petIds.length === 0) {
            return NextResponse.json({ feedLogs: [] });
        }
        query = query.in('pet_id', petIds);
    }

    if (dateFrom) {
        query = query.gte('given_at', dateFrom);
    }
    if (dateTo) {
        query = query.lte('given_at', dateTo);
    }

    const { data: feedLogs, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedLogs });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { pet_id, product_id, quantity_grams, quantity_units, given_at, notes } = body;

        if (!pet_id) {
            return NextResponse.json({ error: "Animal non spécifié" }, { status: 400 });
        }
        if (!quantity_grams && !quantity_units) {
            return NextResponse.json({ error: "Quantité requise" }, { status: 400 });
        }

        // Verify the pet belongs to a household the user is a member of (not viewer)
        const { data: pet } = await supabase
            .from('pets')
            .select('household_id')
            .eq('id', pet_id)
            .single();

        if (!pet) {
            return NextResponse.json({ error: "Animal introuvable" }, { status: 404 });
        }

        const { data: membership } = await supabase
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('household_id', pet.household_id)
            .single();

        if (!membership || membership.role === 'viewer') {
            return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
        }

        // Compute quantity_grams from units if needed
        let finalGrams = quantity_grams ?? null;
        if (!finalGrams && quantity_units && product_id) {
            const { data: product } = await supabase
                .from('products')
                .select('grams_per_unit')
                .eq('id', product_id)
                .single();
            if (product?.grams_per_unit) {
                finalGrams = quantity_units * product.grams_per_unit;
            }
        }

        const { data: feedLog, error } = await supabase
            .from('feed_logs')
            .insert({
                pet_id,
                product_id: product_id || null,
                quantity_grams: finalGrams,
                quantity_units: quantity_units ?? null,
                given_by: user.id,
                given_at: given_at || new Date().toISOString(),
                notes: notes || null,
            })
            .select(`
                *,
                product:products(id, name, brand, product_type, grams_per_unit, verified, photo_url),
                given_by_profile:profiles!feed_logs_given_by_fkey(id, full_name, avatar_url),
                pet:pets!feed_logs_pet_id_fkey(id, name, species, photo_url)
            `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ feedLog }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}

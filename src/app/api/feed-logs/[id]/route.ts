import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

async function getLogAndCheckAccess(supabase: Awaited<ReturnType<typeof createClient>>, logId: string, userId: string) {
    const { data: log } = await supabase
        .from('feed_logs')
        .select('id, given_by, pet_id, pets!feed_logs_pet_id_fkey(household_id)')
        .eq('id', logId)
        .single();

    if (!log) return { log: null, membership: null };

    const pet = Array.isArray(log.pets) ? log.pets[0] : log.pets;
    const householdId = (pet as { household_id: string } | null)?.household_id;
    if (!householdId) return { log: null, membership: null };

    const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', userId)
        .eq('household_id', householdId)
        .single();

    return { log, membership };
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { log, membership } = await getLogAndCheckAccess(supabase, id, user.id);

    if (!log || !membership) {
        return NextResponse.json({ error: "Introuvable ou accès refusé" }, { status: 404 });
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isOwnLog = log.given_by === user.id;

    if (!isOwnerOrAdmin && !isOwnLog) {
        return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres entrées" }, { status: 403 });
    }

    const body = await request.json();
    const { product_id, quantity_grams, quantity_units, given_at, notes } = body;

    // Recompute grams from units if needed
    let finalGrams = quantity_grams ?? undefined;
    if (quantity_units && !quantity_grams && product_id) {
        const { data: product } = await supabase
            .from('products')
            .select('grams_per_unit')
            .eq('id', product_id)
            .single();
        if (product?.grams_per_unit) {
            finalGrams = quantity_units * product.grams_per_unit;
        }
    }

    const updates: Record<string, unknown> = {};
    if (product_id !== undefined) updates.product_id = product_id || null;
    if (finalGrams !== undefined) updates.quantity_grams = finalGrams;
    if (quantity_units !== undefined) updates.quantity_units = quantity_units;
    if (given_at !== undefined) updates.given_at = given_at;
    if (notes !== undefined) updates.notes = notes;

    const { data: updatedLog, error } = await supabase
        .from('feed_logs')
        .update(updates)
        .eq('id', id)
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

    return NextResponse.json({ feedLog: updatedLog });
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { log, membership } = await getLogAndCheckAccess(supabase, id, user.id);

    if (!log || !membership) {
        return NextResponse.json({ error: "Introuvable ou accès refusé" }, { status: 404 });
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isOwnLog = log.given_by === user.id;

    if (!isOwnerOrAdmin && !isOwnLog) {
        return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres entrées" }, { status: 403 });
    }

    const { error } = await supabase.from('feed_logs').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}

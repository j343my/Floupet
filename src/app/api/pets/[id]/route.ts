import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id: petId } = await params;

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { household_id, name, species, breed, birth_date, sex, neutered, target_weight_kg, photo_url, notes } = body;

        if (!household_id) {
            return NextResponse.json({ error: "Foyer non spécifié" }, { status: 400 });
        }

        // Check permission
        const { data: membership, error: memError } = await supabase
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('household_id', household_id)
            .single();

        if (memError || !membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
            return NextResponse.json({ error: "Permissions insuffisantes pour modifier un animal" }, { status: 403 });
        }

        const { data: pet, error: petError } = await supabase
            .from('pets')
            .update({
                name,
                species,
                breed,
                birth_date,
                sex,
                neutered,
                target_weight_kg,
                photo_url,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', petId)
            .eq('household_id', household_id)
            .select()
            .single();

        if (petError) {
            return NextResponse.json({ error: petError.message }, { status: 400 });
        }

        return NextResponse.json({ pet });
    } catch (error) {
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id: petId } = await params;

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const householdId = searchParams.get('householdId');

        if (!householdId) {
            return NextResponse.json({ error: "Foyer non spécifié" }, { status: 400 });
        }

        // Check permission
        const { data: membership, error: memError } = await supabase
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('household_id', householdId)
            .single();

        if (memError || !membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
            return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
        }

        // Logical deletion (archive)
        const { error: petError } = await supabase
            .from('pets')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', petId)
            .eq('household_id', householdId);

        if (petError) {
            return NextResponse.json({ error: petError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}

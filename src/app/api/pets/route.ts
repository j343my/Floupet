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

    if (!householdId) {
        return NextResponse.json({ error: "Foyer non spécifié" }, { status: 400 });
    }

    // Check membership
    const { data: membership, error: memError } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('household_id', householdId)
        .single();

    if (memError || !membership) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', householdId)
        .is('archived_at', null)
        .order('name');

    if (petsError) {
        return NextResponse.json({ error: petsError.message }, { status: 500 });
    }

    return NextResponse.json({ pets });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { household_id, name, species, breed, birth_date, sex, neutered, target_weight_kg, photo_url, notes } = body;

        if (!household_id || !name || !species) {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        // Check if user has permission (Admin or Owner)
        const { data: membership, error: memError } = await supabase
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('household_id', household_id)
            .single();

        if (memError || !membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
            return NextResponse.json({ error: "Permissions insuffisantes pour ajouter un animal" }, { status: 403 });
        }

        const { data: pet, error: petError } = await supabase
            .from('pets')
            .insert({
                household_id,
                name,
                species,
                breed,
                birth_date,
                sex: sex || 'unknown',
                neutered: neutered || false,
                target_weight_kg,
                photo_url,
                notes
            })
            .select()
            .single();

        if (petError) {
            console.error('Pet insertion error:', petError);
            return NextResponse.json({ error: petError.message }, { status: 400 });
        }

        return NextResponse.json({ pet });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: "Une erreur est survenue lors du traitement de votre requête" }, { status: 500 });
    }
}

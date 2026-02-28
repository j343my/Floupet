import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Le nom du foyer est requis" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 1. Create the household and membership atomically via RPC (bypassing RLS recursion)
        const { data: household, error: householdError } = await supabase
            .rpc('create_household_and_join', { household_name: name });

        if (householdError || !household) {
            console.error('Household creation error:', householdError);
            return NextResponse.json({ error: `Erreur lors de la création du foyer: ${householdError?.message || 'Unknown error'}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, household });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

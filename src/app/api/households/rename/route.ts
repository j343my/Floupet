import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(request: Request) {
    try {
        const { name } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: "Le nom du foyer est requis" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const cookieStore = await cookies();
        const household_id = cookieStore.get('floupet_current_household_id')?.value;

        if (!household_id) {
            return NextResponse.json({ error: "Foyer non sélectionné" }, { status: 400 });
        }

        const { error } = await supabase
            .from('households')
            .update({ name: name.trim() })
            .eq('id', household_id);

        if (error) {
            return NextResponse.json({ error: "Erreur lors de la mise à jour du foyer" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

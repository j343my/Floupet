import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "Utilisateur non spécifié" }, { status: 400 });
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

        const { error } = await supabase.rpc('remove_household_member', {
            target_user_id: userId,
            target_household_id: household_id,
        });

        if (error) {
            return NextResponse.json({ error: error.message || "Erreur lors de la suppression du membre" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

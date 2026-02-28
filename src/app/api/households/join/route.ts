import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { invitationId, householdId, role } = await request.json();

        if (!invitationId || !householdId || !role) {
            return NextResponse.json({ error: "Informations d'invitation manquantes" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 1. Join household securely via RPC
        const { error: rpcError } = await supabase.rpc('join_household', {
            invitation_id: invitationId,
            target_household_id: householdId,
            target_role: role
        });

        if (rpcError) {
            console.error('Join household error:', rpcError);
            return NextResponse.json({ error: "L'invitation est invalide ou a expiré." }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

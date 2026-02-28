import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, role } = await request.json();

        if (!email || !role) {
            return NextResponse.json({ error: "L'email et le rôle sont requis" }, { status: 400 });
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

        // Verify that current user has authority (owner/admin)
        const { data: membership } = await supabase
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('household_id', household_id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: "Permissions insuffisantes pour inviter" }, { status: 403 });
        }

        const { error: inviteError } = await supabase.from('invitations').insert({
            household_id,
            email,
            role,
            invited_by: user.id
        });

        if (inviteError) {
            return NextResponse.json({ error: "Erreur lors de la création de l'invitation" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

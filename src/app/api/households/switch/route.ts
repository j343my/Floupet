import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { householdId } = await request.json();

    if (!householdId) {
        return NextResponse.json({ error: "Foyer non spécifié" }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('household_id', householdId)
        .single();

    if (!membership) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set('floupet_current_household_id', householdId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
}

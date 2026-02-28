import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, password, locale = 'fr' } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "L'email et le mot de passe sont requis" }, { status: 400 });
        }

        const supabase = await createClient();
        const origin = (await headers()).get("origin");

        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/api/auth/confirm?next=/${locale}/app`,
            },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Return the session state to help the frontend redirect
        return NextResponse.json({
            success: true,
            requireEmailConfirmation: !data.session
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

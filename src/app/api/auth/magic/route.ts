import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, locale = 'fr' } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
        }

        const supabase = await createClient();
        const origin = (await headers()).get("origin");

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${origin}/api/auth/confirm?next=/${locale}/app`,
            },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "check_email" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Une erreur est survenue" }, { status: 500 });
    }
}

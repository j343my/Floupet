import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // The RLS policy "Admins can update products" handles the actual authorization check to ensure
        // the user has is_admin=true. If they don't, the update will return 0 rows updated but 
        // with Supabase you usually get no error unless you require rows. Let's explicitly check here just in case.

        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (!profile || !profile.is_admin) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { data: product, error } = await supabase
            .from('products')
            .update(body) // body can contain { verified: true }, etc.
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ product });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (!profile || !profile.is_admin) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
    }
}

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AppLayout from "../AppLayout";
import FeedingClient from "./FeedingClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    void locale;
    return { title: "Journal alimentaire — Floupet" };
}

export default async function FeedingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const cookieStore = await cookies();
    const householdId = cookieStore.get('floupet_current_household_id')?.value;

    const { data: memberships } = await supabase
        .from('memberships')
        .select('household_id, role')
        .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
        redirect(`/${locale}/app/households/new`);
    }

    const currentHouseholdId = householdId && memberships.some(m => m.household_id === householdId)
        ? householdId
        : memberships[0].household_id;

    const currentMembership = memberships.find(m => m.household_id === currentHouseholdId);
    const userRole = currentMembership?.role ?? 'member';

    const { data: pets } = await supabase
        .from('pets')
        .select('id, name, species, photo_url, household_id')
        .eq('household_id', currentHouseholdId)
        .is('archived_at', null)
        .order('name');

    return (
        <AppLayout locale={locale}>
            <FeedingClient
                pets={pets ?? []}
                householdId={currentHouseholdId}
                currentUserId={user.id}
                userRole={userRole}
                locale={locale}
            />
        </AppLayout>
    );
}

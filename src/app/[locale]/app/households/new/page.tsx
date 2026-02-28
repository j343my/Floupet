import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import NewHouseholdForm from "./NewHouseholdForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'household' });
    return { title: t('create') };
}

export default async function NewHouseholdPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "household" });
    const tc = await getTranslations({ locale, namespace: "common" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Check profile
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (!profile?.full_name) {
        redirect(`/${locale}/app/onboarding/profile`);
    }

    // Check pending invitations for this email
    const { data: pendingInvitations } = await supabase
        .from('invitations')
        .select('id, household_id, role, households!inner(name)')
        .eq('email', user.email)
        .is('accepted_at', null);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
            <div className="w-full max-w-sm">

                <NewHouseholdForm
                    locale={locale}
                    pendingInvitations={pendingInvitations || []}
                    translations={{
                        create: t("create"),
                        name: t("name"),
                        save: tc("save"),
                        or: tc("or")
                    }}
                />

            </div>
        </div>
    );
}

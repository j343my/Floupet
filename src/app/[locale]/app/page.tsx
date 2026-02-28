import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'common' });
    return { title: `App — ${t('appName')}` };
}

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "common" });
    const tDash = await getTranslations({ locale, namespace: "dashboard" });
    const tNav = await getTranslations({ locale, namespace: "nav" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Check if user has any household
    const { data: memberships } = await supabase
        .from('memberships')
        .select('household_id, role, households!inner(id, name)')
        .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
        redirect(`/${locale}/app/households/new`);
    }

    // Support household switching via cookie
    const cookieStore = await cookies();
    const storedHouseholdId = cookieStore.get('floupet_current_household_id')?.value;

    let currentMembership = storedHouseholdId
        ? memberships.find(m => m.household_id === storedHouseholdId)
        : memberships[0];

    // If cookie was invalid, fallback
    if (!currentMembership) {
        currentMembership = memberships[0];
    }

    const currentHousehold = currentMembership.households;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream">
            <main className="flex flex-col items-center gap-8 text-center">
                {/* Logo */}
                <div className="flex items-center gap-5">
                    <Image
                        src="/favicon.svg"
                        alt="Floupet logo"
                        width={88}
                        height={88}
                        className="shadow-[var(--shadow-coral)] rounded-[28px]"
                    />
                    <div className="text-left">
                        <h1 className="font-display text-[60px] font-bold leading-none tracking-tight text-ink">
                            Flou<span className="text-coral">pet</span>
                        </h1>
                        <p className="mt-1 text-sm font-medium tracking-wide text-gray">
                            {t("tagline")}
                        </p>
                    </div>
                </div>

                {/* Status */}
                <div className="rounded-[var(--radius-lg)] border border-sand bg-warm-white px-8 py-6 shadow-[var(--shadow-sm)]">
                    <p className="font-display text-2xl font-bold text-ink">
                        🚧 {t("appName")} — Phase 1 (APP)
                    </p>
                    <p className="mt-2 text-sm text-gray">
                        Mise en place en cours...
                    </p>
                </div>

                {/* Navigation preview */}
                <div className="flex gap-6 text-xs font-bold uppercase tracking-wider text-gray-light">
                    <span className="text-coral">{tNav("home")}</span>
                    <span>{tNav("pets")}</span>
                    <span>{tNav("meals")}</span>
                    <span>{tNav("health")}</span>
                </div>
            </main >
        </div >
    );
}

import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import OnboardingProfileForm from "./OnboardingProfileForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'common' });
    return { title: `Profil — ${t('appName')}` };
}

export default async function OnboardingProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "common" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Check if profile is already complete
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    if (profile?.full_name) {
        // If profile is already filled, go to household step
        redirect(`/${locale}/app/households/new`);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-6 py-12">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-coral shadow-[var(--shadow-coral)] text-3xl">
                        👋
                    </div>
                    <h1 className="font-display text-3xl font-bold text-ink">
                        Qui êtes-vous ?
                    </h1>
                    <p className="mt-2 text-sm text-gray">
                        Complétez votre profil pour continuer.
                    </p>
                </div>

                <OnboardingProfileForm
                    locale={locale}
                    translations={{ continue: t("continue") }}
                />
            </div>
        </div>
    );
}

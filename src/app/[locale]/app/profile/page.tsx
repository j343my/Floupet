import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "../AppLayout";
import ProfileForm from "./ProfileForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'profile' });
    return { title: `${t('title')} — Floupet` };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const tProfile = await getTranslations({ locale, namespace: "profile" });

    return (
        <AppLayout locale={locale}>
            <ProfileForm
                locale={locale}
                translations={{
                    title: tProfile("title"),
                    personalInfo: tProfile("personalInfo"),
                    fullName: tProfile("fullName"),
                    email: tProfile("email"),
                    save: tProfile("save"),
                    logout: tProfile("logout"),
                    updateSuccess: tProfile("updateSuccess"),
                    error: "Une erreur est survenue"
                }}
                initialData={{
                    full_name: profile?.full_name || "",
                    email: user.email || ""
                }}
            />
        </AppLayout>
    );
}

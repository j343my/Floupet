import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "../../AppLayout";
import NewProductForm from "./NewProductForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale });
    return { title: `${t('products.propose')} — Floupet` };
}

export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Pass necessary translations to the client component
    const translations = {
        save: t("common.save"),
        cancel: t("common.cancel")
    };

    return (
        <AppLayout locale={locale}>
            <div className="flex flex-col gap-8">
                <header>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                        {t("products.propose")}
                    </h1>
                    <p className="mt-1 text-sm text-gray">
                        Aidez la communauté à grandir en ajoutant l'alimentation de votre animal.
                    </p>
                </header>

                <NewProductForm locale={locale} translations={translations} />
            </div>
        </AppLayout>
    );
}

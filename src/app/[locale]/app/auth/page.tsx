import { getTranslations } from "next-intl/server";
import AuthForm from "./AuthForm";
import Logo from "@/components/ui/Logo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'auth' });
    const tc = await getTranslations({ locale, namespace: 'common' });

    return {
        title: `${t('login')} — ${tc('appName')}`,
    };
}

export default async function AuthPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ message?: string, mode?: string }> }) {
    const { locale } = await params;
    const { message, mode = 'login' } = await searchParams;

    // We fetch translations on the server and pass what we need to the Client Component
    // This allows keeping the layout server-rendered for good hydration/SEO
    const t = await getTranslations({ locale, namespace: "auth" });

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
            <div className="w-full max-w-sm">
                <div className="mb-10 flex justify-center">
                    <Logo size={80} showText={false} />
                </div>

                <AuthForm
                    initialMode={mode}
                    initialMessage={message}
                    locale={locale}
                    translations={{
                        login: t("login"),
                        signup: t("signup"),
                        magicLinkSent: t("magicLinkSent"),
                        backToLogin: t("backToLogin"),
                        email: t("email"),
                        password: t("password"),
                        magicLink: t("magicLink"),
                        noAccount: t("noAccount"),
                        hasAccount: t("hasAccount"),
                        useMagicLink: t("useMagicLink"),
                    }}
                />
            </div>
        </div>
    );
}

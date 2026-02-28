import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'auth' });
    const tc = await getTranslations({ locale, namespace: 'common' });

    return {
        title: `${t('login')} — ${tc('appName')}`,
    };
}

export default async function AuthPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ message?: string }> }) {
    const { locale } = await params;
    const { message } = await searchParams;
    const t = await getTranslations({ locale, namespace: "auth" });

    const signInWithMagicLink = async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        const supabase = await createClient();

        // Use headers API to construct redirect URL
        const origin = (await headers()).get("origin");

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // Ensure email redirect URL goes to our API confirm route
                emailRedirectTo: `${origin}/api/auth/confirm?next=/${locale}/app/households/new`,
            },
        });

        if (error) {
            return redirect(`/${locale}/app/auth?message=${error.message}`);
        }

        return redirect(`/${locale}/app/auth?message=check_email`);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
            <div className="w-full max-w-sm">
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-coral shadow-[var(--shadow-coral)]">
                        <Image src="/favicon.svg" alt="Floupet" width={44} height={44} />
                    </div>
                    <h1 className="font-display text-4xl font-bold text-ink">
                        {t("login")}
                    </h1>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
                    {message === "check_email" ? (
                        <div className="rounded-xl bg-teal-light p-4 text-center">
                            <span className="text-3xl">✉️</span>
                            <p className="mt-3 text-sm font-bold text-teal-dark">
                                {t("magicLinkSent")}
                            </p>
                        </div>
                    ) : (
                        <form action={signInWithMagicLink} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="text-[13px] font-bold text-ink-soft">
                                    {t("email")}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="vous@email.com"
                                    required
                                    className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-coral focus:ring-4 focus:ring-coral-light"
                                />
                            </div>

                            {message && message !== "check_email" && (
                                <p className="text-sm font-bold text-coral-dark bg-coral-light p-3 rounded-lg text-center">
                                    {message}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 font-body text-[15px] font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-dark active:scale-95"
                            >
                                <span>📧</span>
                                {t("magicLink")}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

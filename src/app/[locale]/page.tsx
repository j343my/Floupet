import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'common' });
    const tl = await getTranslations({ locale, namespace: 'landing' });

    return {
        title: `${t('appName')} — ${t('tagline')}`,
        description: tl('hero.subtitle'),
    };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "common" });
    const tl = await getTranslations({ locale, namespace: "landing" });

    return (
        <div className="min-h-screen bg-ink text-white selection:bg-coral selection:text-white flex flex-col font-body">
            {/* Nav */}
            <header className="flex w-full items-center justify-between px-6 py-6 lg:px-16">
                <Link href={`/${locale}`} className="flex items-center gap-3">
                    <Logo size={40} textColor="text-white" />
                </Link>
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${locale}/app`}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 active:scale-95"
                    >
                        {tl("hero.cta")}
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 lg:px-16 text-center">
                <div className="flex animate-[float_3.5s_ease-in-out_infinite] items-center justify-center mb-10 h-28 w-28 rounded-[36px] bg-coral shadow-[var(--shadow-coral)]">
                    <Logo size={64} showText={false} />
                </div>

                <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl lg:text-[80px]">
                    {tl("hero.title1")} <span className="text-gray-light">{tl("hero.title2")}</span> <br className="hidden md:block" />
                    <span className="text-coral relative">
                        {tl("hero.title3")}
                    </span>
                </h1>

                <p className="mt-8 max-w-xl text-lg font-medium text-gray-light md:text-xl">
                    {tl("hero.subtitle")}
                </p>

                <div className="mt-12">
                    <Link
                        href={`/${locale}/app`}
                        className="inline-block rounded-full bg-coral px-8 py-4 text-lg font-bold text-white shadow-[var(--shadow-coral)] transition-colors hover:bg-coral-dark"
                    >
                        {tl("hero.cta")}
                    </Link>
                </div>
            </main>

            {/* Features (simplified) */}
            <section className="bg-sand px-6 py-24 text-ink lg:px-16 border-t border-sand-dark">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="font-display text-4xl font-bold">{tl("features.title")}</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="rounded-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-sm)] border border-sand-dark transition-transform hover:-translate-y-1">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-light text-2xl shadow-sm">
                                🍽️
                            </div>
                            <h3 className="mb-3 font-display text-2xl font-bold">{tl("features.feeding.title")}</h3>
                            <p className="text-gray leading-relaxed text-sm font-medium">{tl("features.feeding.desc")}</p>
                        </div>

                        <div className="rounded-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-sm)] border border-sand-dark transition-transform hover:-translate-y-1">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-light text-2xl shadow-sm">
                                ⚖️
                            </div>
                            <h3 className="mb-3 font-display text-2xl font-bold">{tl("features.weight.title")}</h3>
                            <p className="text-gray leading-relaxed text-sm font-medium">{tl("features.weight.desc")}</p>
                        </div>

                        <div className="rounded-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-sm)] border border-sand-dark transition-transform hover:-translate-y-1">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-plum-light text-2xl shadow-sm">
                                ❤️
                            </div>
                            <h3 className="mb-3 font-display text-2xl font-bold">{tl("features.health.title")}</h3>
                            <p className="text-gray leading-relaxed text-sm font-medium">{tl("features.health.desc")}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-ink px-6 py-10 lg:px-16 text-center border-t border-ink-soft">
                <p className="text-sm font-medium text-gray">{tl("footer.copyright")}</p>
            </footer>
        </div>
    );
}

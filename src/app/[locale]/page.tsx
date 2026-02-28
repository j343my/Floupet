import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Home() {
    const t = useTranslations("common");
    const tDash = useTranslations("dashboard");
    const tNav = useTranslations("nav");

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
                        className="shadow-[var(--shadow-coral)]"
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
                        🚧 {t("appName")} — Phase 1
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
            </main>
        </div>
    );
}

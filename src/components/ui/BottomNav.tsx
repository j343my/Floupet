"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BottomNav({ locale }: { locale: string }) {
    const pathname = usePathname();
    const t = useTranslations("nav");

    const navItems = [
        { href: `/${locale}/app`, label: t("home"), icon: "🏠", id: "home" },
        { href: `/${locale}/app/pets`, label: t("pets"), icon: "🐾", id: "pets" },
        { href: `/${locale}/app/feeding`, label: t("meals"), icon: "🍽️", id: "meals" },
        { href: `/${locale}/app/health`, label: t("health"), icon: "❤️", id: "health" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-sand bg-warm-white/80 px-4 pb-safe pt-2 backdrop-blur-lg sm:hidden shadow-[0_-4px_12px_rgba(26,18,8,0.05)]">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={`flex flex-1 flex-col items-center gap-1 py-2 transition-all active:scale-95 ${isActive ? "text-coral" : "text-gray-light"
                            }`}
                    >
                        <span className="text-2xl leading-none">{item.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

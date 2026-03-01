"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Household {
    id: string;
    name: string;
}

export default function HouseholdSelector({
    currentHousehold,
    households,
    locale,
}: {
    currentHousehold: Household;
    households: Household[];
    locale: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    async function switchHousehold(householdId: string) {
        await fetch('/api/households/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ householdId }),
        });
        setIsOpen(false);
        router.refresh();
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full border border-sand bg-warm-white px-4 py-1.5 transition-all hover:bg-white active:scale-95 shadow-[var(--shadow-sm)]"
            >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-coral-light text-[10px]">
                    🏠
                </div>
                <span className="text-xs font-bold text-ink">{currentHousehold.name}</span>
                <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/5"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-sand bg-white shadow-xl">
                        <div className="border-b border-sand bg-cream/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-light">
                            Mes Foyers
                        </div>
                        {households.map((h) => (
                            <button
                                key={h.id}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-cream ${h.id === currentHousehold.id ? "font-bold text-coral" : "text-ink"}`}
                                onClick={() => switchHousehold(h.id)}
                            >
                                <span className="text-lg">🏠</span>
                                <span>{h.name}</span>
                                {h.id === currentHousehold.id && <span className="ml-auto text-xs">✓</span>}
                            </button>
                        ))}
                        <div className="border-t border-sand p-2 flex flex-col gap-1">
                            <Link
                                href={`/${locale}/app/households/settings`}
                                onClick={() => setIsOpen(false)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-cream"
                            >
                                <span>⚙️</span>
                                <span>Paramètres du foyer</span>
                            </Link>
                            <Link
                                href={`/${locale}/app/households/new`}
                                onClick={() => setIsOpen(false)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-coral transition-colors hover:bg-coral-light"
                            >
                                <span>+</span>
                                <span>Créer un foyer</span>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

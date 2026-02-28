"use client";

import { useState } from "react";

interface Household {
    id: string;
    name: string;
}

export default function HouseholdSelector({
    currentHousehold,
    households,
}: {
    currentHousehold: Household;
    households: Household[];
}) {
    const [isOpen, setIsOpen] = useState(false);

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
                    <div className="absolute left-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-sand bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="border-b border-sand bg-cream/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-light">
                            Mes Foyers
                        </div>
                        {households.map((h) => (
                            <button
                                key={h.id}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-cream ${h.id === currentHousehold.id ? "font-bold text-coral" : "text-ink"
                                    }`}
                                onClick={() => {
                                    // Handle switch (e.g., set cookie and refresh)
                                    setIsOpen(false);
                                }}
                            >
                                <span className="text-lg">🏠</span>
                                <span>{h.name}</span>
                            </button>
                        ))}
                        <div className="border-t border-sand-dark p-2">
                            <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-coral transition-colors hover:bg-coral-light">
                                <span>+</span>
                                <span>Créer un foyer</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

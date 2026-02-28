"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedLog, Pet, PetSummary } from "@/types";
import AddMealForm from "../../feeding/AddMealForm";
import FeedLogItem from "../../feeding/FeedLogItem";

interface PetFeedingSummaryProps {
    pet: Pet;
    householdId: string;
    currentUserId: string;
    userRole: string;
    locale: string;
    allPets: PetSummary[];
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default function PetFeedingSummary({
    pet,
    householdId,
    currentUserId,
    userRole,
    locale,
    allPets,
}: PetFeedingSummaryProps) {
    const [feedLogs, setFeedLogs] = useState<FeedLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const today = formatDate(new Date());

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                householdId,
                petId: pet.id,
                dateFrom: `${today}T00:00:00.000Z`,
                dateTo: `${today}T23:59:59.999Z`,
            });
            const res = await fetch(`/api/feed-logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setFeedLogs(data.feedLogs ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [householdId, pet.id, today]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    function handleLogDeleted(id: string) {
        setFeedLogs(prev => prev.filter(l => l.id !== id));
    }

    const totalGrams = feedLogs.reduce((sum, l) => sum + (l.quantity_grams ?? 0), 0);
    const lastMeal = feedLogs.length > 0
        ? new Date(feedLogs[0].given_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null;

    const canAddMeal = userRole !== 'viewer';

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink">Repas du jour</h2>
                {canAddMeal && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="rounded-full bg-coral px-5 py-2 text-xs font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95"
                    >
                        + Repas
                    </button>
                )}
            </div>

            {/* Add meal form */}
            {showForm && (
                <div className="rounded-[var(--radius-lg)] border border-coral/20 bg-white p-5 shadow-[var(--shadow-md)]">
                    <AddMealForm
                        pets={allPets}
                        initialPetId={pet.id}
                        householdId={householdId}
                        onSuccess={() => {
                            setShowForm(false);
                            fetchLogs();
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}

            {/* Daily summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</div>
                    <div className="mt-1 font-display text-xl font-bold text-teal-600">
                        {loading ? '–' : totalGrams > 0 ? `${totalGrams}g` : '–'}
                    </div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Repas</div>
                    <div className="mt-1 font-display text-xl font-bold text-ink">
                        {loading ? '–' : feedLogs.length}
                    </div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dernier</div>
                    <div className="mt-1 font-display text-lg font-bold text-plum">
                        {loading ? '–' : lastMeal ?? '–'}
                    </div>
                </div>
            </div>

            {/* Log list */}
            <div className="flex flex-col gap-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sand border-t-coral" />
                    </div>
                ) : feedLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sand bg-warm-white/50 py-10 text-center">
                        <span className="text-3xl">🍽️</span>
                        <p className="mt-2 text-sm text-gray-500">Aucun repas enregistré aujourd&apos;hui</p>
                    </div>
                ) : (
                    feedLogs.map(log => (
                        <FeedLogItem
                            key={log.id}
                            log={log}
                            currentUserId={currentUserId}
                            userRole={userRole}
                            onDeleted={handleLogDeleted}
                            locale={locale}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

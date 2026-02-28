"use client";

import { useState, useEffect, useCallback } from "react";
import { Pet, FeedLog } from "@/types";
import AddMealForm from "./AddMealForm";
import FeedLogItem from "./FeedLogItem";

interface FeedingClientProps {
    pets: Pet[];
    householdId: string;
    currentUserId: string;
    userRole: string;
    locale: string;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getDateLabel(dateStr: string): string {
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (dateStr === today) return "Aujourd'hui";
    if (dateStr === yesterday) return "Hier";
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function FeedingClient({ pets, householdId, currentUserId, userRole, locale }: FeedingClientProps) {
    const [selectedPetId, setSelectedPetId] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
    const [feedLogs, setFeedLogs] = useState<FeedLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ householdId });
            if (selectedPetId !== 'all') params.set('petId', selectedPetId);
            // Fetch the full selected day (UTC)
            params.set('dateFrom', `${selectedDate}T00:00:00.000Z`);
            params.set('dateTo', `${selectedDate}T23:59:59.999Z`);

            const res = await fetch(`/api/feed-logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setFeedLogs(data.feedLogs ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [householdId, selectedPetId, selectedDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    function handleLogDeleted(id: string) {
        setFeedLogs(prev => prev.filter(l => l.id !== id));
    }

    function navigateDay(delta: number) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(formatDate(d));
    }

    const totalGrams = feedLogs.reduce((sum, l) => sum + (l.quantity_grams ?? 0), 0);
    const mealCount = feedLogs.length;
    const lastMeal = feedLogs.length > 0
        ? new Date(feedLogs[0].given_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null;

    const isToday = selectedDate === formatDate(new Date());
    const canAddMeal = userRole !== 'viewer';

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                        Journal alimentaire
                    </h1>
                    <p className="text-gray-500 text-sm">Suivez les repas de vos compagnons</p>
                </div>
                {canAddMeal && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95 self-start sm:self-auto"
                    >
                        + Repas
                    </button>
                )}
            </div>

            {/* Add meal form */}
            {showForm && (
                <section className="rounded-[var(--radius-lg)] border border-coral/20 bg-white p-6 shadow-[var(--shadow-md)]">
                    <h2 className="mb-5 font-display text-xl font-bold text-ink">Nouveau repas</h2>
                    <AddMealForm
                        pets={pets}
                        initialPetId={selectedPetId !== 'all' ? selectedPetId : pets[0]?.id}
                        householdId={householdId}
                        onSuccess={() => {
                            setShowForm(false);
                            // Refresh to today if not there
                            setSelectedDate(formatDate(new Date()));
                            fetchLogs();
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                </section>
            )}

            {/* Pet filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setSelectedPetId('all')}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        selectedPetId === 'all'
                            ? 'bg-ink text-white'
                            : 'bg-cream text-ink hover:bg-sand'
                    }`}
                >
                    Tous
                </button>
                {pets.map(pet => (
                    <button
                        key={pet.id}
                        onClick={() => setSelectedPetId(pet.id)}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                            selectedPetId === pet.id
                                ? 'bg-coral text-white shadow-[var(--shadow-coral)]'
                                : 'bg-cream text-ink hover:bg-sand'
                        }`}
                    >
                        <span>{pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}</span>
                        {pet.name}
                    </button>
                ))}
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigateDay(-1)}
                    className="rounded-full bg-cream p-2 text-sm font-bold text-gray-600 hover:bg-sand transition-colors"
                >
                    ←
                </button>
                <div className="flex-1 text-center">
                    <span className="font-display font-bold text-ink capitalize">
                        {getDateLabel(selectedDate)}
                    </span>
                    {!isToday && (
                        <button
                            onClick={() => setSelectedDate(formatDate(new Date()))}
                            className="ml-3 text-xs text-coral hover:underline font-bold"
                        >
                            Revenir à aujourd&apos;hui
                        </button>
                    )}
                </div>
                <button
                    onClick={() => navigateDay(1)}
                    disabled={isToday}
                    className="rounded-full bg-cream p-2 text-sm font-bold text-gray-600 hover:bg-sand transition-colors disabled:opacity-30"
                >
                    →
                </button>
            </div>

            {/* Daily summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</div>
                    <div className="mt-1 font-display text-2xl font-bold text-teal-600">
                        {totalGrams > 0 ? `${totalGrams}g` : '–'}
                    </div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Repas</div>
                    <div className="mt-1 font-display text-2xl font-bold text-ink">{mealCount}</div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dernier</div>
                    <div className="mt-1 font-display text-xl font-bold text-plum">
                        {lastMeal ?? '–'}
                    </div>
                </div>
            </div>

            {/* Feed log list */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-coral" />
                    </div>
                ) : feedLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sand bg-warm-white/50 py-16 text-center">
                        <span className="text-5xl">🍽️</span>
                        <h3 className="mt-4 font-display text-xl font-bold text-ink">Aucun repas enregistré</h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-xs">
                            {isToday
                                ? "Enregistrez le premier repas de la journée."
                                : "Aucun repas n'a été enregistré ce jour."}
                        </p>
                        {canAddMeal && isToday && !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-6 rounded-full bg-coral px-8 py-3 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95"
                            >
                                + Ajouter un repas
                            </button>
                        )}
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
        </div>
    );
}

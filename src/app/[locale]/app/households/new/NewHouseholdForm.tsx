"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewHouseholdForm({
    locale, pendingInvitations, translations: t
}: {
    locale: string, pendingInvitations: any[], translations: any
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingInvId, setLoadingInvId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleCreateHousehold = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;

        try {
            const res = await fetch(`/api/households/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue");
            } else {
                router.push(`/${locale}/app`);
                router.refresh();
            }
        } catch (err) {
            setError("Une erreur réseau est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinHousehold = async (invitationId: string, householdId: string, role: string) => {
        setLoadingInvId(invitationId);
        setError("");

        try {
            const res = await fetch(`/api/households/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invitationId, householdId, role }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue");
            } else {
                router.push(`/${locale}/app`);
                router.refresh();
            }
        } catch (err) {
            setError("Une erreur réseau est survenue.");
        } finally {
            setLoadingInvId(null);
        }
    }

    return (
        <>
            {/* Pending Invitations Section */}
            {pendingInvitations && pendingInvitations.length > 0 && (
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-teal-light shadow-[var(--shadow-sm)] text-3xl">
                        💌
                    </div>
                    <h1 className="font-display text-2xl font-bold text-ink mb-2">
                        Invitations en attente
                    </h1>
                    <p className="text-sm text-gray mb-6">
                        On vous a invité à rejoindre ces foyers.
                    </p>

                    <div className="flex flex-col gap-4">
                        {pendingInvitations.map((inv) => (
                            <div key={inv.id} className="rounded-[var(--radius-md)] border border-sand bg-white p-4 shadow-sm flex items-center justify-between text-left">
                                <div>
                                    <p className="font-bold text-ink">{(inv.households as any)?.name || 'Foyer inconnu'}</p>
                                    <p className="text-xs text-gray uppercase tracking-wider mt-1">{inv.role}</p>
                                </div>
                                <button
                                    onClick={() => handleJoinHousehold(inv.id, inv.household_id, inv.role)}
                                    disabled={loadingInvId === inv.id}
                                    className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-ink shadow-[var(--shadow-teal)] transition-all hover:bg-teal-dark hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {loadingInvId === inv.id ? "..." : "Rejoindre"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="my-8 flex items-center justify-center gap-4">
                        <hr className="w-1/3 border-sand" />
                        <span className="text-xs font-bold text-gray uppercase tracking-wider">{t.or}</span>
                        <hr className="w-1/3 border-sand" />
                    </div>
                </div>
            )}

            {/* Create Household Section */}
            <div className="text-center">
                {!pendingInvitations?.length && (
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-teal shadow-[var(--shadow-teal)] text-3xl">
                        🏡
                    </div>
                )}
                <h2 className="font-display text-2xl font-bold text-ink mb-2">
                    {t.create}
                </h2>
                <p className="mb-6 text-sm text-gray">
                    Donnez un nom à votre foyer pour commencer.
                </p>

                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)] text-left">
                    <form onSubmit={handleCreateHousehold} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name" className="text-[13px] font-bold text-ink-soft">
                                {t.name}
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="..."
                                required
                                disabled={isLoading}
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-teal focus:ring-4 focus:ring-teal-light disabled:opacity-50"
                            />
                        </div>

                        {error && (
                            <p className="text-sm font-bold text-coral-dark bg-coral-light p-3 rounded-lg text-center animate-fade-in">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-full bg-teal px-6 py-3.5 font-body text-[15px] font-bold text-ink shadow-[var(--shadow-teal)] transition-all hover:bg-teal-dark hover:text-white active:scale-95 disabled:hover:bg-teal disabled:opacity-80 disabled:scale-100 disabled:cursor-wait"
                        >
                            {isLoading ? "Création..." : t.save}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

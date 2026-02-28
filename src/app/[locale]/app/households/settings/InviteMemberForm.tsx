"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteMemberForm({ locale }: { locale: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const role = formData.get("role") as string;

        try {
            const res = await fetch(`/api/invitations/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue");
            } else {
                // Let's clear the form
                (e.target as HTMLFormElement).reset();
                router.refresh();
            }
        } catch (err) {
            setError("Une erreur réseau est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
            <h2 className="font-display text-xl font-bold text-ink mb-6">Inviter un proche</h2>
            <form onSubmit={handleInvite} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-[13px] font-bold text-ink-soft">Adresse Email</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="proche@email.com"
                        required
                        disabled={isLoading}
                        className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-teal focus:ring-4 focus:ring-teal-light disabled:opacity-50"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="role" className="text-[13px] font-bold text-ink-soft">Rôle</label>
                    <select
                        name="role"
                        id="role"
                        disabled={isLoading}
                        className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-teal focus:ring-4 focus:ring-teal-light disabled:opacity-50"
                    >
                        <option value="member">Membre (Ajoute des logs)</option>
                        <option value="admin">Admin (Gère les fiches animaux)</option>
                        <option value="viewer">Observateur (Lecture seule)</option>
                    </select>
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
                    {isLoading ? "Envoi en cours..." : "Envoyer l'invitation"}
                </button>
            </form>
        </div>
    );
}

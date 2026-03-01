"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RenameHouseholdForm({ initialName }: { initialName: string }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim() || name.trim() === initialName) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/households/rename", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue");
            } else {
                setIsEditing(false);
                router.refresh();
            }
        } catch {
            setError("Une erreur réseau est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                    {name}
                </h1>
                <button
                    onClick={() => setIsEditing(true)}
                    className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-sand hover:text-ink"
                    title="Renommer le foyer"
                >
                    ✏️
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={isLoading}
                className="font-display text-2xl font-bold text-ink rounded-[var(--radius-sm)] border-2 border-teal bg-white px-3 py-1 outline-none focus:ring-4 focus:ring-teal-light disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="shrink-0 rounded-full bg-teal px-4 py-1.5 text-sm font-bold text-ink transition-all hover:bg-teal-dark hover:text-white disabled:opacity-50"
            >
                {isLoading ? "…" : "Enregistrer"}
            </button>
            <button
                type="button"
                onClick={() => { setIsEditing(false); setName(initialName); setError(""); }}
                disabled={isLoading}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-gray-400 transition-colors hover:bg-sand hover:text-ink disabled:opacity-50"
            >
                Annuler
            </button>
            {error && <p className="text-xs font-bold text-coral-dark">{error}</p>}
        </form>
    );
}

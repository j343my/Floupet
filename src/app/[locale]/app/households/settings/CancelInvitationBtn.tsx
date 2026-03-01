"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelInvitationBtn({
    invitationId,
    email,
}: {
    invitationId: string;
    email: string;
}) {
    const router = useRouter();
    const [isConfirming, setIsConfirming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCancel = async () => {
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/invitations/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invitationId }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue");
                setIsConfirming(false);
            } else {
                router.refresh();
            }
        } catch {
            setError("Une erreur réseau est survenue.");
            setIsConfirming(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <span className="text-xs font-bold text-coral-dark">{error}</span>
        );
    }

    if (isConfirming) {
        return (
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 hidden sm:inline">Annuler l'invitation ?</span>
                <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-white transition-all hover:bg-coral-dark disabled:opacity-50"
                >
                    {isLoading ? "…" : "Confirmer"}
                </button>
                <button
                    onClick={() => setIsConfirming(false)}
                    disabled={isLoading}
                    className="rounded-full px-3 py-1 text-xs font-bold text-gray-400 transition-colors hover:bg-sand hover:text-ink disabled:opacity-50"
                >
                    Garder
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsConfirming(true)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-gray-400 transition-all hover:bg-coral-light hover:text-coral-dark"
            title={`Annuler l'invitation de ${email}`}
        >
            Annuler
        </button>
    );
}

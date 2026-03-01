"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductApprovalForm({ productId, isVerified }: { productId: string, isVerified: boolean }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleApprove = async () => {
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ verified: true })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Une erreur est survenue");
            }

            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette proposition ?");
        if (!confirmDelete) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Une erreur est survenue");
            }

            // Go back to the products list since it's deleted
            router.push(`/fr/admin/products`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {error && (
                <div className="rounded-xl border border-coral bg-coral-light p-4 text-sm font-bold text-coral">
                    {error}
                </div>
            )}

            {!isVerified ? (
                <div className="flex gap-4">
                    <button
                        onClick={handleApprove}
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-teal-dark px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-teal disabled:opacity-50"
                    >
                        {isLoading ? "En cours..." : "✅ Approuver"}
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-coral px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-coral-dark disabled:opacity-50"
                    >
                        {isLoading ? "En cours..." : "❌ Rejeter & Supprimer"}
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border border-teal bg-teal-light p-4 text-center font-bold text-teal-dark">
                    Ce produit a été validé.
                </div>
            )}
        </div>
    );
}

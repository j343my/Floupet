"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingProfileForm({ locale, translations: t }: { locale: string, translations: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get("fullName") as string;

        try {
            const res = await fetch(`/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue");
            } else {
                router.push(`/${locale}/app/households/new`);
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="fullName" className="text-[13px] font-bold text-ink-soft">
                        Votre nom ou pseudo
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        placeholder="..."
                        required
                        disabled={isLoading}
                        className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-coral focus:ring-4 focus:ring-coral-light disabled:opacity-50"
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
                    className="w-full rounded-full bg-coral px-6 py-3.5 font-body text-[15px] font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-dark active:scale-95 disabled:hover:bg-coral disabled:opacity-80 disabled:scale-100 disabled:cursor-wait"
                >
                    {isLoading ? "Enregistrement..." : `${t.continue} →`}
                </button>
            </form>
        </div>
    );
}

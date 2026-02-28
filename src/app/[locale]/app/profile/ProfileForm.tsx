"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
    locale,
    translations: t,
    initialData
}: {
    locale: string;
    translations: any;
    initialData: { full_name: string; email: string };
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        setIsSuccess(false);

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get("fullName") as string;

        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || t.error);
            } else {
                setMessage(t.updateSuccess);
                setIsSuccess(true);
                router.refresh();
            }
        } catch (err) {
            setMessage("Erreur réseau");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return;

        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                router.push(`/${locale}/app/auth`);
                router.refresh();
            }
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    return (
        <div className="flex flex-col gap-10">
            <header>
                <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
                    {t.title}
                </h1>
            </header>

            <div className="grid gap-10 md:grid-cols-3">
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-light">
                            {t.personalInfo}
                        </h2>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="fullName" className="text-[13px] font-bold text-ink-soft">
                                {t.fullName}
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                id="fullName"
                                defaultValue={initialData.full_name}
                                required
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            />
                        </div>

                        <div className="flex flex-col gap-2 opacity-60">
                            <label className="text-[13px] font-bold text-ink-soft">
                                {t.email}
                            </label>
                            <input
                                type="email"
                                value={initialData.email}
                                disabled
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-sand-light px-4 py-3 font-body text-[14px] text-ink outline-none"
                            />
                            <p className="text-[10px] text-gray italic">L'adresse email ne peut pas être modifiée pour le moment.</p>
                        </div>

                        {message && (
                            <p className={`rounded-lg p-3 text-center text-sm font-bold ${isSuccess ? "bg-teal-light text-teal-dark" : "bg-coral-light text-coral-dark"}`}>
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-4 rounded-full bg-coral px-8 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? "Enregistrement..." : t.save}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-light">Compte</h2>
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-coral-light py-3 text-sm font-bold text-coral transition-all hover:bg-coral-light active:scale-95"
                        >
                            <span className="text-xl">🚪</span>
                            {t.logout}
                        </button>
                    </div>

                    <div className="rounded-[var(--radius-lg)] border border-sand bg-warm-white/50 p-6 text-center italic text-gray">
                        <p className="text-xs">Version 1.0.0-beta</p>
                        <p className="mt-1 text-[10px]">© 2026 Floupet</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({
    initialMode, initialMessage, locale, translations: t
}: {
    initialMode: string, initialMessage?: string, locale: string, translations: any
}) {
    const router = useRouter();
    const [mode, setMode] = useState(initialMode);
    const [message, setMessage] = useState(initialMessage || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await fetch(`/api/auth/${mode}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, locale }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Une erreur est survenue");
            } else {
                if (data.message === "check_email" || data.requireEmailConfirmation) {
                    setMode("magic");
                    setMessage("check_email");
                } else {
                    router.push(`/${locale}/app`);
                    router.refresh();
                }
            }
        } catch (err) {
            setMessage("Une erreur réseau est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h1 className="font-display text-4xl font-bold text-ink text-center mb-10 -mt-10">
                {mode === 'signup' ? t.signup : t.login}
            </h1>
            <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
                {message === "check_email" ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="rounded-xl bg-teal-light p-4 w-full mb-6 relative overflow-hidden">
                            <span className="text-3xl relative z-10">✉️</span>
                            <p className="mt-3 text-sm font-bold text-teal-dark relative z-10">
                                {t.magicLinkSent}
                            </p>
                        </div>
                        <button onClick={() => { setMode('login'); setMessage(""); }} className="text-sm font-bold text-coral hover:text-coral-dark transition-colors">
                            {t.backToLogin}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="text-[13px] font-bold text-ink-soft">
                                {t.email}
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="vous@email.com"
                                required
                                disabled={isLoading}
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-coral focus:ring-4 focus:ring-coral-light disabled:opacity-50"
                            />
                        </div>

                        {mode !== 'magic' && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="password" className="text-[13px] font-bold text-ink-soft">
                                    {t.password}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                    className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-coral focus:ring-4 focus:ring-coral-light disabled:opacity-50"
                                />
                            </div>
                        )}

                        {message && message !== "check_email" && (
                            <p className="text-sm font-bold text-coral-dark bg-coral-light p-3 rounded-lg text-center animate-fade-in">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 font-body text-[15px] font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-dark active:scale-95 disabled:hover:bg-coral disabled:opacity-80 disabled:scale-100 disabled:cursor-wait"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">En cours...</span>
                            ) : mode === 'signup' ? t.signup :
                                mode === 'magic' ? (
                                    <><span>📧</span> {t.magicLink}</>
                                ) : t.login}
                        </button>
                    </form>
                )}

                {/* Navigation Links */}
                {message !== "check_email" && (
                    <div className="mt-8 flex flex-col gap-4 border-t border-sand pt-6 text-center text-sm font-bold">
                        {mode === 'login' && (
                            <>
                                <button onClick={() => setMode('signup')} className="text-ink hover:text-coral transition-colors">
                                    {t.noAccount}
                                </button>
                                <button onClick={() => setMode('magic')} className="text-gray-light hover:text-ink transition-colors">
                                    {t.useMagicLink}
                                </button>
                            </>
                        )}
                        {mode === 'signup' && (
                            <button onClick={() => setMode('login')} className="text-ink hover:text-coral transition-colors">
                                {t.hasAccount}
                            </button>
                        )}
                        {mode === 'magic' && (
                            <button onClick={() => setMode('login')} className="text-ink hover:text-coral transition-colors">
                                {t.backToLogin}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

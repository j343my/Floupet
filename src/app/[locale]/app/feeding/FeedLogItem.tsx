"use client";

import { useState } from "react";
import { FeedLog } from "@/types";

interface FeedLogItemProps {
    log: FeedLog;
    currentUserId: string;
    userRole: string;
    onDeleted: (id: string) => void;
    locale: string;
}

export default function FeedLogItem({ log, currentUserId, userRole, onDeleted }: FeedLogItemProps) {
    const [deleting, setDeleting] = useState(false);

    const canDelete =
        log.given_by === currentUserId ||
        userRole === 'owner' ||
        userRole === 'admin';

    const givenAt = new Date(log.given_at);
    const timeStr = givenAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    async function handleDelete() {
        if (!confirm('Supprimer ce repas ?')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/feed-logs/${log.id}`, { method: 'DELETE' });
            if (res.ok) {
                onDeleted(log.id);
            }
        } finally {
            setDeleting(false);
        }
    }

    const quantityDisplay = log.quantity_units
        ? `${log.quantity_units} portion${log.quantity_units > 1 ? 's' : ''}${log.quantity_grams ? ` (${log.quantity_grams}g)` : ''}`
        : log.quantity_grams
        ? `${log.quantity_grams}g`
        : '–';

    const pet = log.pet;
    const petIcon = pet?.species === 'cat' ? '🐱' : pet?.species === 'dog' ? '🐶' : '🐾';

    return (
        <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-sand bg-white p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
            {/* Time */}
            <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-cream px-2 py-3">
                <span className="text-xs font-bold text-coral">{timeStr}</span>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                    {pet && (
                        <span className="text-sm">{petIcon}</span>
                    )}
                    <span className="font-bold text-ink truncate">
                        {pet?.name ?? 'Animal'}
                    </span>
                    {log.product && (
                        <>
                            <span className="text-gray-300">·</span>
                            <span className="truncate text-sm text-gray-600">{log.product.name}</span>
                            {!log.product.verified && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 shrink-0">
                                    Non vérifié
                                </span>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xl font-display font-bold text-teal-600">{quantityDisplay}</span>
                </div>

                {log.notes && (
                    <p className="text-xs text-gray-400 italic">{log.notes}</p>
                )}

                {log.given_by_profile?.full_name && (
                    <p className="text-[10px] text-gray-400">
                        Donné par {log.given_by_profile.full_name}
                    </p>
                )}
            </div>

            {/* Actions */}
            {canDelete && (
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="shrink-0 rounded-xl p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    title="Supprimer"
                >
                    {deleting ? '...' : '🗑️'}
                </button>
            )}
        </div>
    );
}

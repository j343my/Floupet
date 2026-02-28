"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePetBtn({
    petId,
    householdId,
    locale,
    petName
}: {
    petId: string;
    householdId: string;
    locale: string;
    petName: string;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir archiver ${petName} ? Ses données seront conservées mais il n'apparaîtra plus dans la liste active.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/pets/${petId}?householdId=${householdId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push(`/${locale}/app/pets`);
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Une erreur est survenue");
            }
        } catch (err) {
            alert("Erreur réseau");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isLoading}
            className="rounded-full border-2 border-coral-light bg-warm-white px-6 py-2 text-xs font-bold text-coral transition-all hover:bg-coral-light active:scale-95 disabled:opacity-50"
        >
            {isLoading ? "Archivage..." : "Archiver l'animal"}
        </button>
    );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface PetFormProps {
    locale: string;
    translations: any;
    householdId: string;
    initialData?: any;
    isEditing?: boolean;
}

export default function PetForm({
    locale,
    translations: t,
    householdId,
    initialData,
    isEditing = false
}: PetFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo_url || null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const speciesOptions = [
        { value: 'cat', label: t.speciesOptions.cat, icon: '🐱' },
        { value: 'dog', label: t.speciesOptions.dog, icon: '🐶' },
        { value: 'rabbit', label: t.speciesOptions.rabbit, icon: '🐰' },
        { value: 'bird', label: t.speciesOptions.bird, icon: '🐦' },
        { value: 'fish', label: t.speciesOptions.fish, icon: '🐠' },
        { value: 'reptile', label: t.speciesOptions.reptile, icon: '🦎' },
        { value: 'other', label: t.speciesOptions.other, icon: '🐾' },
    ];

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const species = formData.get("species") as string;
        const breed = formData.get("breed") as string;
        const birth_date = formData.get("birth_date") as string;
        const sex = formData.get("sex") as string;
        const neutered = formData.get("neutered") === "on";
        const target_weight_kg = formData.get("target_weight_kg") ? parseFloat(formData.get("target_weight_kg") as string) : null;
        const notes = formData.get("notes") as string;

        try {
            let photo_url = initialData?.photo_url || null;

            // 1. Upload photo if changed
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${householdId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('pets')
                    .upload(filePath, photoFile);

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('pets')
                    .getPublicUrl(filePath);

                photo_url = publicUrl;
            }

            // 2. Save pet data
            const petData = {
                household_id: householdId,
                name,
                species,
                breed,
                birth_date: birth_date || null,
                sex,
                neutered,
                target_weight_kg,
                photo_url,
                notes
            };

            const url = isEditing ? `/api/pets/${initialData.id}` : '/api/pets';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(petData),
            });

            const result = await res.json();

            if (!res.ok) {
                setMessage(result.error || "Une erreur est survenue");
            } else {
                router.push(`/${locale}/app/pets`);
                router.refresh();
            }
        } catch (err: any) {
            console.error('Error saving pet:', err);
            setMessage("Erreur lors de l'enregistrement : " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-ink mb-8">
                {isEditing ? `Modifier ${initialData.name}` : t.add}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {/* Photo Section */}
                <div className="flex flex-col items-center gap-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-sand bg-cream transition-all hover:border-coral active:scale-95"
                    >
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-gray-light">
                                <span className="text-3xl">📷</span>
                                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">Photo</span>
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-xs font-bold text-white">Changer</span>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="grid gap-6 rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
                    {/* Basic Info */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name" className="text-[13px] font-bold text-ink-soft">
                                {t.name}
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                defaultValue={initialData?.name}
                                placeholder="ex: Mochi"
                                required
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="species" className="text-[13px] font-bold text-ink-soft">
                                {t.species}
                            </label>
                            <select
                                name="species"
                                id="species"
                                defaultValue={initialData?.species || "cat"}
                                required
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light appearance-none"
                            >
                                {speciesOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.icon} {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="breed" className="text-[13px] font-bold text-ink-soft">
                                {t.breed}
                            </label>
                            <input
                                type="text"
                                name="breed"
                                id="breed"
                                defaultValue={initialData?.breed}
                                placeholder="ex: Bengal, Golden Retriever..."
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="birth_date" className="text-[13px] font-bold text-ink-soft">
                                {t.birthDate}
                            </label>
                            <input
                                type="date"
                                name="birth_date"
                                id="birth_date"
                                defaultValue={initialData?.birth_date}
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-bold text-ink-soft">
                                {t.sex}
                            </label>
                            <div className="flex gap-2">
                                {['male', 'female', 'unknown'].map((s) => (
                                    <label key={s} className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-sand p-3 transition-all hover:bg-cream has-[:checked]:border-coral has-[:checked]:bg-coral-light has-[:checked]:text-coral">
                                        <input
                                            type="radio"
                                            name="sex"
                                            value={s}
                                            defaultChecked={initialData?.sex === s || (s === 'unknown' && !initialData?.sex)}
                                            className="hidden"
                                        />
                                        <span className="text-xs font-bold uppercase tracking-wider">{t.sexOptions[s]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="target_weight_kg" className="text-[13px] font-bold text-ink-soft">
                                {t.targetWeight} (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="target_weight_kg"
                                id="target_weight_kg"
                                defaultValue={initialData?.target_weight_kg}
                                placeholder="ex: 4.5"
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="neutered"
                            id="neutered"
                            defaultChecked={initialData?.neutered}
                            className="h-5 w-5 rounded border-2 border-sand text-coral focus:ring-coral accent-coral"
                        />
                        <label htmlFor="neutered" className="text-[14px] font-bold text-ink">
                            {t.neutered}
                        </label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="notes" className="text-[13px] font-bold text-ink-soft">
                            {t.notes}
                        </label>
                        <textarea
                            name="notes"
                            id="notes"
                            rows={3}
                            defaultValue={initialData?.notes}
                            placeholder="Allergies, tempérament..."
                            className="w-full rounded-[var(--radius-md)] border-2 border-sand bg-warm-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                        />
                    </div>
                </div>

                {message && (
                    <p className="rounded-lg bg-coral-light p-4 text-center text-sm font-bold text-coral-dark">
                        {message}
                    </p>
                )}

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 rounded-full border-2 border-sand bg-warm-white py-4 text-sm font-bold text-ink transition-all hover:bg-white active:scale-95"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] rounded-full bg-coral py-4 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Enregistrement..." : (isEditing ? "Enregistrer les modifications" : "Ajouter mon compagnon")}
                    </button>
                </div>
            </form>
        </div>
    );
}

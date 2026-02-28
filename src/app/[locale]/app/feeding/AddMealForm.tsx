"use client";

import { useState } from "react";
import { PetSummary, Product } from "@/types";

interface AddMealFormProps {
    pets: PetSummary[];
    initialPetId?: string;
    householdId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AddMealForm({ pets, initialPetId, onSuccess, onCancel }: AddMealFormProps) {
    const [petId, setPetId] = useState(initialPetId || (pets[0]?.id ?? ''));
    const [quantityGrams, setQuantityGrams] = useState('');
    const [quantityUnits, setQuantityUnits] = useState('');
    const [inputMode, setInputMode] = useState<'grams' | 'units'>('grams');
    const [givenAt, setGivenAt] = useState(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16);
    });
    const [notes, setNotes] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function searchProducts(query: string) {
        if (query.length < 2) {
            setProducts([]);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products ?? []);
            }
        } finally {
            setSearchLoading(false);
        }
    }

    function handleProductSearch(value: string) {
        setProductSearch(value);
        if (!value) {
            setSelectedProduct(null);
            setProducts([]);
            return;
        }
        searchProducts(value);
    }

    function selectProduct(product: Product) {
        setSelectedProduct(product);
        setProductSearch(product.name + (product.brand ? ` — ${product.brand}` : ''));
        setProducts([]);
        // If product has grams_per_unit, offer unit mode
        if (product.grams_per_unit) {
            setInputMode('units');
        }
    }

    function clearProduct() {
        setSelectedProduct(null);
        setProductSearch('');
        setProducts([]);
        setInputMode('grams');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!petId) {
            setError("Veuillez sélectionner un animal.");
            return;
        }
        if (inputMode === 'grams' && !quantityGrams) {
            setError("Veuillez saisir une quantité en grammes.");
            return;
        }
        if (inputMode === 'units' && !quantityUnits) {
            setError("Veuillez saisir une quantité en portions.");
            return;
        }

        setSubmitting(true);
        try {
            const body: Record<string, unknown> = {
                pet_id: petId,
                given_at: new Date(givenAt).toISOString(),
                notes: notes || null,
            };

            if (selectedProduct) {
                body.product_id = selectedProduct.id;
            }

            if (inputMode === 'grams') {
                body.quantity_grams = parseFloat(quantityGrams);
            } else {
                body.quantity_units = parseFloat(quantityUnits);
                if (selectedProduct?.grams_per_unit) {
                    body.quantity_grams = parseFloat(quantityUnits) * selectedProduct.grams_per_unit;
                }
            }

            const res = await fetch('/api/feed-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue.");
                return;
            }

            onSuccess();
        } finally {
            setSubmitting(false);
        }
    }

    const selectedPet = pets.find(p => p.id === petId);
    const canUseUnits = selectedProduct?.grams_per_unit != null;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Animal selector */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Animal
                </label>
                <div className="flex flex-wrap gap-2">
                    {pets.map((pet) => (
                        <button
                            key={pet.id}
                            type="button"
                            onClick={() => setPetId(pet.id)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                                petId === pet.id
                                    ? 'bg-coral text-white shadow-[var(--shadow-coral)]'
                                    : 'bg-cream text-ink hover:bg-sand'
                            }`}
                        >
                            <span>{pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}</span>
                            {pet.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product search */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Produit <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => handleProductSearch(e.target.value)}
                        placeholder="Rechercher dans le catalogue..."
                        className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                    />
                    {selectedProduct && (
                        <button
                            type="button"
                            onClick={clearProduct}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                        >
                            ✕
                        </button>
                    )}
                    {/* Dropdown results */}
                    {products.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-sand bg-white shadow-[var(--shadow-md)]">
                            {searchLoading && (
                                <div className="p-3 text-center text-sm text-gray-400">Recherche...</div>
                            )}
                            {products.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => selectProduct(product)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-cream"
                                >
                                    <div>
                                        <div className="font-bold text-ink">{product.name}</div>
                                        <div className="text-xs text-gray-400">
                                            {product.brand && `${product.brand} · `}
                                            {product.grams_per_unit ? `${product.grams_per_unit}g/portion` : ''}
                                            {!product.verified && (
                                                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                                    Non vérifié
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {selectedProduct && !selectedProduct.verified && (
                    <p className="text-xs text-amber-600">
                        ⚠️ Ce produit n&apos;a pas encore été vérifié par un administrateur.
                    </p>
                )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Quantité
                </label>

                {canUseUnits && (
                    <div className="flex rounded-2xl border border-sand bg-cream p-1 w-fit gap-1 mb-2">
                        <button
                            type="button"
                            onClick={() => setInputMode('grams')}
                            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${inputMode === 'grams' ? 'bg-white shadow-sm text-ink' : 'text-gray-500'}`}
                        >
                            Grammes
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMode('units')}
                            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${inputMode === 'units' ? 'bg-white shadow-sm text-ink' : 'text-gray-500'}`}
                        >
                            Portions
                        </button>
                    </div>
                )}

                {inputMode === 'grams' ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={quantityGrams}
                            onChange={(e) => setQuantityGrams(e.target.value)}
                            placeholder="0"
                            className="w-32 rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                        />
                        <span className="text-sm font-bold text-gray-500">g</span>
                        {canUseUnits && selectedProduct?.grams_per_unit && quantityGrams && (
                            <span className="text-xs text-gray-400">
                                ≈ {(parseFloat(quantityGrams) / selectedProduct.grams_per_unit).toFixed(1)} portion(s)
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={quantityUnits}
                            onChange={(e) => setQuantityUnits(e.target.value)}
                            placeholder="0"
                            className="w-32 rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                        />
                        <span className="text-sm font-bold text-gray-500">portion(s)</span>
                        {selectedProduct?.grams_per_unit && quantityUnits && (
                            <span className="text-xs text-gray-400">
                                = {(parseFloat(quantityUnits) * selectedProduct.grams_per_unit).toFixed(0)}g
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Date / time */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date & heure
                </label>
                <input
                    type="datetime-local"
                    value={givenAt}
                    onChange={(e) => setGivenAt(e.target.value)}
                    className="w-full max-w-xs rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
                />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Notes <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex. : repas du matin, a tout mangé..."
                    rows={2}
                    className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 resize-none"
                />
            </div>

            {error && (
                <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full border border-sand px-6 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-cream"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-coral px-8 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95 disabled:opacity-60"
                >
                    {submitting ? 'Enregistrement...' : 'Enregistrer le repas'}
                </button>
            </div>
        </form>
    );
}

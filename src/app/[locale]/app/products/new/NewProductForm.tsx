"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/ui/BarcodeScanner";

export default function NewProductForm({ locale, translations }: { locale: string, translations: any }) {
    const router = useRouter();
    const [isScanning, setIsScanning] = useState(false);
    const [barcode, setBarcode] = useState("");
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [productType, setProductType] = useState("kibble");
    const [netWeight, setNetWeight] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");

    const handleScanSuccess = async (decodedText: string) => {
        setBarcode(decodedText);
        setIsScanning(false);
        setLookupStatus("loading");

        try {
            const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(decodedText)}`);
            const data = await res.json();

            if (data.product) {
                const p = data.product;
                if (p.name) setName(p.name);
                if (p.brand) setBrand(p.brand);
                if (p.product_type) setProductType(p.product_type);
                if (p.net_weight_g) setNetWeight(String(p.net_weight_g));
                setLookupStatus("found");
            } else {
                setLookupStatus("not_found");
            }
        } catch {
            setLookupStatus("not_found");
        }
    };

    const handleManualScan = () => {
        setIsScanning(!isScanning);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    barcode: barcode || null,
                    name,
                    brand: brand || null,
                    product_type: productType,
                    net_weight_g: netWeight ? parseFloat(netWeight) : null,
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Une erreur est survenue");
            }

            // Success, go back to catalog
            router.push(`/${locale}/app/products`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg">
            {isScanning ? (
                <div className="mb-8">
                    <BarcodeScanner
                        onScanSuccess={handleScanSuccess}
                        onScanFailure={(err) => console.log("Scan failed:", err)}
                        debug={process.env.NODE_ENV === "development"}
                    />
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={handleManualScan}
                            className="text-sm font-bold text-gray underline underline-offset-4"
                        >
                            Saisir manuellement
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)] border border-sand">

                    {error && (
                        <div className="rounded-xl border border-coral bg-coral-light p-4 text-sm font-bold text-coral">
                            {error}
                        </div>
                    )}

                    {!barcode && (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-sand bg-sand-light p-8 text-center">
                            <span className="text-3xl">📳</span>
                            <h3 className="font-display font-bold text-ink">Scanner un produit</h3>
                            <p className="text-xs text-gray-light max-w-[250px]">
                                Scannez le code-barres pour pré-remplir la fiche ou identifier le produit plus facilement à l'avenir.
                            </p>
                            <button
                                type="button"
                                onClick={handleManualScan}
                                className="mt-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-ink-soft active:scale-95"
                            >
                                Ouvrir le scanner
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label htmlFor="barcode" className="text-sm font-bold text-ink">
                            Code-barres (Optionnel)
                        </label>
                        <input
                            id="barcode"
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            className="rounded-[var(--radius-lg)] border-2 border-sand bg-sand-light px-4 py-3 font-body text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            placeholder="Ex: 3011146743818"
                        />
                        {lookupStatus === "loading" && (
                            <p className="text-xs font-medium text-gray">Recherche du produit en cours...</p>
                        )}
                        {lookupStatus === "found" && (
                            <p className="text-xs font-bold text-green-600">Produit trouvé et pré-rempli automatiquement.</p>
                        )}
                        {lookupStatus === "not_found" && (
                            <p className="text-xs font-medium text-gray">Produit inconnu, remplissez le formulaire manuellement.</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-bold text-ink">
                            Nom du produit *
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-[var(--radius-lg)] border-2 border-sand bg-sand-light px-4 py-3 font-body text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            placeholder="Ex: Pâtée saumon et dinde"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="brand" className="text-sm font-bold text-ink">
                            Marque (Optionnel)
                        </label>
                        <input
                            id="brand"
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="rounded-[var(--radius-lg)] border-2 border-sand bg-sand-light px-4 py-3 font-body text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            placeholder="Ex: Royal Canin"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="productType" className="text-sm font-bold text-ink">
                                Type de produit *
                            </label>
                            <select
                                id="productType"
                                required
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                className="rounded-[var(--radius-lg)] border-2 border-sand bg-sand-light px-4 py-3 font-body text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                            >
                                <option value="kibble">Croquettes</option>
                                <option value="wet_food">Pâtée</option>
                                <option value="pouch">Sachet</option>
                                <option value="treat">Friandise</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="netWeight" className="text-sm font-bold text-ink">
                                Poids net (g)
                            </label>
                            <input
                                id="netWeight"
                                type="number"
                                min="1"
                                value={netWeight}
                                onChange={(e) => setNetWeight(e.target.value)}
                                className="rounded-[var(--radius-lg)] border-2 border-sand bg-sand-light px-4 py-3 font-body text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <div className="mt-4 pt-6 border-t border-sand">
                        <button
                            type="submit"
                            disabled={isLoading || !name}
                            className="w-full rounded-xl bg-coral py-4 font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-dark active:scale-95 disabled:opacity-50 disabled:shadow-none"
                        >
                            {isLoading ? "Envoi..." : "Proposer ce produit"}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs font-medium text-gray">
                            Le produit sera ajouté avec le statut <span className="text-coral">non vérifié</span> en attendant la validation d'un membre de l'équipe Floupet.
                        </p>
                    </div>
                </form>
            )}
        </div>
    );
}

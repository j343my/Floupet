import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductApprovalForm from "./ProductApprovalForm";

export default async function AdminProductDetailsPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    const supabase = await createClient();

    const { data: product } = await supabase
        .from('products')
        .select(`
            *,
            profiles!products_created_by_fkey(full_name, email)
        `)
        .eq('id', id)
        .single();

    if (!product) {
        notFound();
    }

    return (
        <div className="flex max-w-2xl flex-col gap-8">
            <header className="flex items-center gap-4">
                <Link
                    href={`/${locale}/admin/products`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:-translate-x-1"
                >
                    <span className="text-xl">←</span>
                </Link>
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                        Détails du produit
                    </h1>
                    <p className="text-sm text-gray">
                        ID: <span className="font-mono">{product.id}</span>
                    </p>
                </div>
            </header>

            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-sand bg-white shadow-[var(--shadow-sm)]">
                <div className="flex flex-col sm:flex-row">
                    <div className="flex h-48 w-full shrink-0 flex-col items-center justify-center bg-sand-light sm:w-48">
                        {product.photo_url ? (
                            <Image
                                src={product.photo_url}
                                alt={product.name}
                                width={192}
                                height={192}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-6xl">🥫</span>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-6">
                        <div>
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-2xl font-bold text-ink">{product.name}</h2>
                                {product.verified ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light px-2.5 py-1 text-xs font-bold text-teal-dark">
                                        ✅ Validé
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-light px-2.5 py-1 text-xs font-bold text-coral-dark">
                                        ⏳ En attente
                                    </span>
                                )}
                            </div>
                            {product.brand && <p className="text-sm font-bold uppercase tracking-wider text-gray-light">{product.brand}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div>
                                <span className="block text-xs text-gray">Type</span>
                                <span className="font-medium text-ink">{product.product_type}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray">Poids net</span>
                                <span className="font-medium text-ink">{product.net_weight_g ? `${product.net_weight_g} g` : "-"}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray">Grammes par unité</span>
                                <span className="font-medium text-ink">{product.grams_per_unit || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray">Kcal / 100g</span>
                                <span className="font-medium text-ink">{product.kcal_per_100g || "-"}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-xs text-gray">Code-barres</span>
                                <span className="font-mono font-medium text-ink">{product.barcode || "Non renseigné"}</span>
                            </div>
                        </div>

                        <div className="mt-2 border-t border-sand pt-4 text-sm text-gray">
                            Proposé par : <strong>{product.profiles?.full_name || "Utilisateur inconnu"}</strong>
                            {product.profiles?.email && ` (${product.profiles.email})`}
                            <br />
                            Date : {new Date(product.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <ProductApprovalForm productId={product.id} isVerified={product.verified} />
        </div>
    );
}

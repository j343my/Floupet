import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function AdminProductsPage() {
    const supabase = await createClient();

    // Fetch all products, order by verified ASC (false first) then created_at DESC
    const { data: products } = await supabase
        .from('products')
        .select(`
            id, name, brand, product_type, verified, barcode, created_at, photo_url,
            profiles!products_created_by_fkey(full_name)
        `)
        .order('verified', { ascending: true })
        .order('created_at', { ascending: false });

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
                        Gestion des Produits
                    </h1>
                    <p className="mt-1 text-gray">
                        Validez les propositions de la communauté.
                    </p>
                </div>
            </header>

            <div className="rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-sm)] border border-sand overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body text-sm">
                        <thead className="bg-sand-light text-ink-soft border-b border-sand">
                            <tr>
                                <th className="px-6 py-4 font-bold">Produit</th>
                                <th className="px-6 py-4 font-bold">Code-barres</th>
                                <th className="px-6 py-4 font-bold">Proposé par</th>
                                <th className="px-6 py-4 font-bold">Statut</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sand">
                            {products?.map((product) => (
                                <tr key={product.id} className="transition-colors hover:bg-sand-light/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand-light text-xl overflow-hidden">
                                                {product.photo_url ? (
                                                    <Image src={product.photo_url} alt="" width={40} height={40} className="object-cover" />
                                                ) : "🥫"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-ink">{product.name}</div>
                                                <div className="text-xs text-gray">{product.brand || "Sans marque"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {product.barcode || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-gray">
                                        {product.profiles?.full_name || "Système"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.verified ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light px-2.5 py-1 text-xs font-bold text-teal-dark">
                                                ✅ Validé
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-light px-2.5 py-1 text-xs font-bold text-coral-dark">
                                                ⏳ En attente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/fr/admin/products/${product.id}`}
                                            className="font-bold text-coral hover:underline"
                                        >
                                            Examiner
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!products || products.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray">
                                        Aucun produit trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

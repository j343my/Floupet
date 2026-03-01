import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "../AppLayout";
import Link from "next/link";
import Image from "next/image";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale });
    return { title: `${t('products.catalog')} — Floupet` };
}

export default async function ProductsCatalogPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ q?: string }> }) {
    const { locale } = await params;
    const { q = "" } = await searchParams;

    const t = await getTranslations({ locale });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Server-side fetching
    let query = supabase
        .from('products')
        .select(`
            id, name, brand, product_type, grams_per_unit, net_weight_g, kcal_per_100g, verified, photo_url, barcode,
            profiles!products_created_by_fkey(full_name)
        `)
        .is('deleted_at', null)
        .order('verified', { ascending: false })
        .order('name')
        .limit(30);

    if (q) {
        query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,barcode.eq.${q}`);
    }

    const { data: products } = await query;

    return (
        <AppLayout locale={locale}>
            <div className="flex flex-col gap-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                            {t("products.catalog")}
                        </h1>
                        <p className="mt-1 text-sm text-gray">
                            Cherchez ou scannez un produit pour l'ajouter à un repas.
                        </p>
                    </div>
                    <Link
                        href={`/${locale}/app/products/new`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-dark active:scale-95"
                    >
                        <span className="text-xl">📷</span> Scanner / Ajouter
                    </Link>
                </header>

                {/* Search Bar */}
                <section>
                    <form className="relative flex max-w-md items-center shadow-[var(--shadow-sm)]">
                        <span className="absolute left-4 text-xl">🔍</span>
                        <input
                            type="text"
                            name="q"
                            defaultValue={q}
                            placeholder={t("products.search")}
                            className="w-full rounded-[var(--radius-lg)] border-2 border-sand bg-white py-3 pl-12 pr-4 font-body text-sm text-ink outline-none transition-all focus:border-coral focus:ring-4 focus:ring-coral-light"
                        />
                    </form>
                </section>

                {/* Results List */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products && products.length > 0 ? (
                        products.map((product) => (
                            <div
                                key={product.id}
                                className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-sand bg-white p-5 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
                            >
                                <div className="flex gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand-light text-2xl">
                                        {product.photo_url ? (
                                            <Image src={product.photo_url} alt={product.name} width={64} height={64} className="h-full w-full object-cover" />
                                        ) : (
                                            <span>🥫</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="line-clamp-2 font-display text-base font-bold leading-tight text-ink">
                                                {product.name}
                                            </h3>
                                        </div>
                                        {product.brand && (
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-light">
                                                {product.brand}
                                            </span>
                                        )}
                                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-full bg-sand px-2 py-0.5 font-medium text-ink-soft">
                                                {product.product_type}
                                            </span>
                                            {product.net_weight_g && (
                                                <span className="rounded-full bg-sand px-2 py-0.5 font-medium text-ink-soft">
                                                    {product.net_weight_g}g
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-sand pt-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                        {product.verified ? (
                                            <>
                                                <span className="text-teal-dark">✅</span>
                                                <span className="text-teal-dark">{t("products.verified")}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-coral">⏳</span>
                                                <span className="text-coral">En attente de validation</span>
                                            </>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray uppercase tracking-wider">
                                        {product.barcode || "Sans code-barres"}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full rounded-[var(--radius-lg)] border-2 border-dashed border-sand p-10 text-center bg-white/50">
                            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-coral-light text-3xl">
                                🤔
                            </span>
                            <h3 className="mt-4 font-display text-xl font-bold text-ink">
                                Aucun produit trouvé
                            </h3>
                            <p className="mt-2 mx-auto max-w-sm text-sm text-gray">
                                Vous ne trouvez pas la marque de votre compagnon ? Proposez-la pour enrichir la base de données.
                            </p>
                            <Link
                                href={`/${locale}/app/products/new`}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-ink-soft active:scale-95"
                            >
                                <span>✨</span> Proposer un produit
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

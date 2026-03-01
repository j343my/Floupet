import { createClient } from "@/utils/supabase/server";

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch some basic stats
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: householdsCount } = await supabase.from('households').select('*', { count: 'exact', head: true });
    const { count: petsCount } = await supabase.from('pets').select('*', { count: 'exact', head: true });

    const { count: productsTotal } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: productsPending } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('verified', false);

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
                    Dashboard Admin
                </h1>
                <p className="mt-1 text-gray">
                    Bienvenue dans le centre de contrôle de Floupet.
                </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)] border border-sand">
                    <h3 className="font-bold text-gray">Utilisateurs inscrits</h3>
                    <p className="mt-2 font-display text-4xl font-bold text-ink">{usersCount || 0}</p>
                </div>

                <div className="rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)] border border-sand">
                    <h3 className="font-bold text-gray">Foyers créés</h3>
                    <p className="mt-2 font-display text-4xl font-bold text-ink">{householdsCount || 0}</p>
                </div>

                <div className="rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-sm)] border border-sand">
                    <h3 className="font-bold text-gray">Animaux enregistrés</h3>
                    <p className="mt-2 font-display text-4xl font-bold text-ink">{petsCount || 0}</p>
                </div>

                <div className="rounded-[var(--radius-lg)] bg-coral-light p-6 shadow-[var(--shadow-sm)] border border-coral sm:col-span-2 lg:col-span-3 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-coral-dark">Propositions de Produits</h3>
                        <p className="mt-1 text-sm text-coral-dark">
                            Il y a <strong className="text-xl">{productsPending || 0}</strong> produits en attente de vérification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

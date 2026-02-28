import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "./AppLayout";
import Link from "next/link";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'common' });
    return { title: `Tableau de bord — ${t('appName')}` };
}

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "common" });
    const tDash = await getTranslations({ locale, namespace: "dashboard" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    // The AppLayout also does these checks, but we need some info here for the greeting
    const firstName = profile?.full_name?.split(' ')[0] || "Ami";

    // Check memberships for household data
    const { data: memberships } = await supabase
        .from('memberships')
        .select('household_id, role, households!inner(id, name)')
        .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
        redirect(`/${locale}/app/households/new`);
    }

    const cookieStore = await cookies();
    const storedHouseholdId = cookieStore.get('floupet_current_household_id')?.value;

    const currentHouseholdId = storedHouseholdId && memberships.some(m => m.household_id === storedHouseholdId)
        ? storedHouseholdId
        : memberships[0].household_id;

    // Fetch real pets
    const { data: pets } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', currentHouseholdId)
        .is('archived_at', null)
        .order('name');

    return (
        <AppLayout locale={locale}>
            <div className="flex flex-col gap-8">
                {/* Header / Greeting */}
                <section className="flex flex-col gap-2">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                        {tDash("greeting", { name: firstName })}
                    </h1>
                    <p className="text-gray">{tDash("today")}, 28 Février</p>
                </section>

                {/* Quick Actions Grid */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-light">
                        {tDash("quickActions")}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Link href={`/${locale}/app/feeding`} className="flex flex-col items-center gap-3 rounded-3xl bg-coral-light p-6 transition-all active:scale-95 shadow-[var(--shadow-sm)]">
                            <span className="text-3xl text-coral">🍽️</span>
                            <span className="text-xs font-bold text-coral-dark">{tDash("addMeal")}</span>
                        </Link>
                        <Link href={`/${locale}/app/health`} className="flex flex-col items-center gap-3 rounded-3xl bg-teal-light p-6 transition-all active:scale-95 shadow-[var(--shadow-sm)]">
                            <span className="text-3xl text-teal-dark">⚖️</span>
                            <span className="text-xs font-bold text-teal-dark">{tDash("addWeight")}</span>
                        </Link>
                        <Link href={`/${locale}/app/health`} className="flex flex-col items-center gap-3 rounded-3xl bg-plum-light p-6 transition-all active:scale-95 shadow-[var(--shadow-sm)]">
                            <span className="text-3xl text-plum-dark">💊</span>
                            <span className="text-xs font-bold text-plum-dark">Médicament</span>
                        </Link>
                        <Link href={`/${locale}/app/pets/new`} className="flex flex-col items-center gap-3 rounded-3xl bg-sand p-6 transition-all active:scale-95 shadow-[var(--shadow-sm)]">
                            <span className="text-3xl text-gray">🐾</span>
                            <span className="text-xs font-bold text-gray-dark">Animal</span>
                        </Link>
                    </div>
                </section>

                {/* Status Cards */}
                <section className="grid gap-4 sm:grid-cols-2">
                    {pets && pets.length > 0 ? (
                        pets.slice(0, 4).map((pet) => (
                            <Link
                                key={pet.id}
                                href={`/${locale}/app/pets/${pet.id}`}
                                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-sand bg-white p-5 shadow-[var(--shadow-sm)] transition-all hover:translate-y-[-2px]"
                            >
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-cream text-2xl">
                                    {pet.photo_url ? (
                                        <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span>{pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-display text-lg font-bold text-ink">{pet.name}</span>
                                        <span className="text-xs font-bold text-coral">Actif</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                                        <div className="h-full bg-coral" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full rounded-2xl border-2 border-dashed border-sand p-8 text-center bg-white/50">
                            <p className="text-sm font-bold text-gray">Aucun animal enregistré</p>
                            <Link href={`/${locale}/app/pets/new`} className="mt-2 inline-block text-xs font-bold text-coral underline">
                                Ajouter un compagnon
                            </Link>
                        </div>
                    )}
                </section>

                {/* Recent Activity (Placeholder) */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-light">
                        {tDash("recentActivity")}
                    </h2>
                    <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 text-center shadow-[var(--shadow-sm)]">
                        <p className="text-sm text-gray">Aucune activité récente pour le moment.</p>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

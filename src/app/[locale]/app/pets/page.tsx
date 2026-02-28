import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "../AppLayout";
import Link from "next/link";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'common' });
    return { title: `${t('nav.pets')} — ${t('appName')}` };
}

export default async function PetsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "common" });
    const tPets = await getTranslations({ locale, namespace: "pets" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Get current household from cookie (consistent with AppLayout)
    const cookieStore = await cookies();
    const householdId = cookieStore.get('floupet_current_household_id')?.value;

    // Fetch memberships to find the right household if cookie is missing
    const { data: memberships } = await supabase
        .from('memberships')
        .select('household_id, role')
        .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
        redirect(`/${locale}/app/households/new`);
    }

    const currentHouseholdId = householdId && memberships.some(m => m.household_id === householdId)
        ? householdId
        : memberships[0].household_id;

    const currentMembership = memberships.find(m => m.household_id === currentHouseholdId);
    const canEdit = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

    // Fetch pets
    const { data: pets, error } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', currentHouseholdId)
        .is('archived_at', null)
        .order('name');

    return (
        <AppLayout locale={locale}>
            <div className="flex flex-col gap-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                            {tPets("title")}
                        </h1>
                        <p className="text-gray">{pets?.length || 0} compagnons enregistrés</p>
                    </div>
                    {canEdit && (
                        <Link
                            href={`/${locale}/app/pets/new`}
                            className="rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95"
                        >
                            {tPets("add")}
                        </Link>
                    )}
                </header>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pets && pets.length > 0 ? (
                        pets.map((pet) => (
                            <Link
                                key={pet.id}
                                href={`/${locale}/app/pets/${pet.id}`}
                                className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-sand bg-white transition-all hover:shadow-[var(--shadow-md)]"
                            >
                                <div className="relative h-48 w-full bg-cream">
                                    {pet.photo_url ? (
                                        <img
                                            src={pet.photo_url}
                                            alt={pet.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-6xl opacity-50">
                                            {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                        {tPets(`speciesOptions.${pet.species}`)}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-display text-xl font-bold text-ink group-hover:text-coral transition-colors">
                                            {pet.name}
                                        </h3>
                                        <span className="text-sm font-bold text-gray-light">
                                            {pet.sex === 'male' ? '♂' : pet.sex === 'female' ? '♀' : ''}
                                        </span>
                                    </div>
                                    {pet.breed && (
                                        <p className="text-xs text-gray">{pet.breed}</p>
                                    )}
                                    <div className="mt-4 flex gap-2">
                                        {pet.target_weight_kg && (
                                            <div className="rounded-lg bg-teal-light px-2 py-1 text-[10px] font-bold text-teal-dark">
                                                Cible: {pet.target_weight_kg}kg
                                            </div>
                                        )}
                                        {pet.neutered && (
                                            <div className="rounded-lg bg-plum-light px-2 py-1 text-[10px] font-bold text-plum-dark">
                                                Stérilisé
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sand bg-warm-white/50 py-20 text-center">
                            <span className="text-6xl">🐾</span>
                            <h3 className="mt-4 font-display text-xl font-bold text-ink">Aucun animal pour l'instant</h3>
                            <p className="mt-2 text-sm text-gray max-w-xs">
                                Ajoutez vos compagnons pour commencer à suivre leur alimentation et leur santé.
                            </p>
                            {canEdit && (
                                <Link
                                    href={`/${locale}/app/pets/new`}
                                    className="mt-6 rounded-full bg-coral px-8 py-3 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95"
                                >
                                    {tPets("add")}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

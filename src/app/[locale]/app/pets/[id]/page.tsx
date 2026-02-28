import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import AppLayout from "../../AppLayout";
import PetForm from "../PetForm";
import DeletePetBtn from "../DeletePetBtn";
import PetFeedingSummary from "./PetFeedingSummary";
import { cookies } from "next/headers";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: pet } = await supabase.from('pets').select('name').eq('id', id).single();
    return { title: `${pet?.name || 'Animal'} — Floupet` };
}

export default async function PetDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string, id: string }>;
    searchParams: Promise<{ edit?: string }>;
}) {
    const { locale, id } = await params;
    const { edit } = await searchParams;
    const isEditing = edit === "true";

    const tPets = await getTranslations({ locale, namespace: "pets" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const cookieStore = await cookies();
    const householdId = cookieStore.get('floupet_current_household_id')?.value;

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
    const userRole = currentMembership?.role ?? 'member';

    const { data: pet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .eq('household_id', currentHouseholdId)
        .single();

    if (error || !pet) {
        notFound();
    }

    const { data: allPets } = await supabase
        .from('pets')
        .select('id, name, species, photo_url, household_id')
        .eq('household_id', currentHouseholdId)
        .is('archived_at', null)
        .order('name');

    const canEdit = userRole === 'owner' || userRole === 'admin';

    if (isEditing && !canEdit) {
        redirect(`/${locale}/app/pets/${id}`);
    }

    return (
        <AppLayout locale={locale}>
            <div className="flex flex-col gap-8">
                {isEditing ? (
                    <PetForm
                        locale={locale}
                        translations={{
                            add: tPets("add"),
                            name: tPets("name"),
                            species: tPets("species"),
                            breed: tPets("breed"),
                            birthDate: tPets("birthDate"),
                            sex: tPets("sex"),
                            neutered: tPets("neutered"),
                            targetWeight: tPets("targetWeight"),
                            notes: tPets("notes"),
                            speciesOptions: {
                                cat: tPets("speciesOptions.cat"),
                                dog: tPets("speciesOptions.dog"),
                                rabbit: tPets("speciesOptions.rabbit"),
                                bird: tPets("speciesOptions.bird"),
                                fish: tPets("speciesOptions.fish"),
                                reptile: tPets("speciesOptions.reptile"),
                                other: tPets("speciesOptions.other")
                            },
                            sexOptions: {
                                male: tPets("sexOptions.male"),
                                female: tPets("sexOptions.female"),
                                unknown: tPets("sexOptions.unknown")
                            }
                        }}
                        householdId={currentHouseholdId}
                        initialData={pet}
                        isEditing={true}
                    />
                ) : (
                    <>
                        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 overflow-hidden rounded-3xl border-2 border-sand bg-cream shadow-[var(--shadow-sm)]">
                                    {pet.photo_url ? (
                                        <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-4xl opacity-50">
                                            {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
                                        {pet.name}
                                    </h1>
                                    <p className="text-gray">
                                        {tPets(`speciesOptions.${pet.species}`)} {pet.breed ? `• ${pet.breed}` : ''}
                                    </p>
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex gap-3">
                                    <DeletePetBtn
                                        petId={pet.id}
                                        householdId={currentHouseholdId}
                                        locale={locale}
                                        petName={pet.name}
                                    />
                                    <Link
                                        href={`/${locale}/app/pets/${id}?edit=true`}
                                        className="rounded-full bg-coral px-8 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all hover:translate-y-[-2px] active:scale-95"
                                    >
                                        Modifier le profil
                                    </Link>
                                </div>
                            )}
                        </header>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-light">Sexe</div>
                                <div className="mt-1 text-lg font-bold text-ink">{tPets(`sexOptions.${pet.sex}`)}</div>
                            </div>
                            <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-light">Date de naissance</div>
                                <div className="mt-1 text-lg font-bold text-ink">{pet.birth_date ? new Date(pet.birth_date).toLocaleDateString(locale) : 'Non renseignée'}</div>
                            </div>
                            <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-light">Poids cible</div>
                                <div className="mt-1 text-lg font-bold text-teal-dark">{pet.target_weight_kg ? `${pet.target_weight_kg} kg` : 'Non défini'}</div>
                            </div>
                        </div>

                        {pet.notes && (
                            <section className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-light mb-3">Notes</h3>
                                <p className="text-ink whitespace-pre-wrap">{pet.notes}</p>
                            </section>
                        )}

                        <PetFeedingSummary
                            pet={pet}
                            householdId={currentHouseholdId}
                            currentUserId={user.id}
                            userRole={userRole}
                            locale={locale}
                            allPets={allPets ?? []}
                        />
                    </>
                )}
            </div>
        </AppLayout>
    );
}

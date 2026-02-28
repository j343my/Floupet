import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "../../AppLayout";
import PetForm from "../PetForm";
import { cookies } from "next/headers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'pets' });
    return { title: `${t('add')} — Floupet` };
}

export default async function NewPetPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const tPets = await getTranslations({ locale, namespace: "pets" });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Get current household from cookie
    const cookieStore = await cookies();
    const householdId = cookieStore.get('floupet_current_household_id')?.value;

    // Fetch memberships to confirm access
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

    // Only Owner/Admin can add pets
    if (currentMembership?.role !== 'owner' && currentMembership?.role !== 'admin') {
        redirect(`/${locale}/app/pets`);
    }

    return (
        <AppLayout locale={locale}>
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
            />
        </AppLayout>
    );
}

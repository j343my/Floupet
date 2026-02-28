import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'common' });
    return { title: `Foyers — ${t('appName')}` };
}

export default async function HouseholdsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const { data: memberships } = await supabase
        .from('memberships')
        .select('household_id, role, households!inner(id, name)')
        .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
        redirect(`/${locale}/app/households/new`);
    }

    const selectHousehold = async (formData: FormData) => {
        "use server";
        const householdId = formData.get("householdId") as string;
        if (householdId) {
            const cookieStore = await cookies();
            cookieStore.set('floupet_current_household_id', householdId, { path: '/' });
        }
        redirect(`/${locale}/app`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-coral shadow-[var(--shadow-coral)] text-3xl">
                        🏘️
                    </div>
                    <h1 className="font-display text-3xl font-bold text-ink">
                        Vos Foyers
                    </h1>
                    <p className="mt-2 text-sm text-gray">
                        Sélectionnez un foyer pour continuer.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {memberships.map((m) => (
                        <form key={m.household_id} action={selectHousehold}>
                            <input type="hidden" name="householdId" value={m.household_id} />
                            <button
                                type="submit"
                                className="w-full text-left rounded-[var(--radius-lg)] border border-sand bg-white p-5 shadow-[var(--shadow-sm)] transition-all hover:border-coral hover:ring-2 hover:ring-coral-light active:scale-95 flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-display text-lg font-bold text-ink">
                                        {Array.isArray(m.households as any) ? (m.households as any)[0].name : (m.households as any).name}
                                    </p>
                                    <p className="text-xs font-bold text-gray uppercase tracking-wider mt-1">{m.role}</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-sand flex items-center justify-center text-ink">
                                    →
                                </div>
                            </button>
                        </form>
                    ))}

                    <Link
                        href={`/${locale}/app/households/new`}
                        className="mt-4 w-full rounded-full border-2 border-dashed border-sand-dark py-4 text-center font-bold text-gray-light transition-colors hover:border-coral hover:text-coral"
                    >
                        + Créer un nouveau foyer
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'household' });
    return { title: `Settings — ${t('settings') ?? 'Foyer'}` };
}

export default async function HouseholdSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "common" });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const cookieStore = await cookies();
    const currentHouseholdId = cookieStore.get('floupet_current_household_id')?.value;

    if (!currentHouseholdId) {
        redirect(`/${locale}/app/households`);
    }

    const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('household_id', currentHouseholdId)
        .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        redirect(`/${locale}/app`); // Not authorized
    }

    const { data: members } = await supabase
        .from('memberships')
        .select('id, role, profiles(id, email, full_name)')
        .eq('household_id', currentHouseholdId);

    const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('household_id', currentHouseholdId)
        .is('accepted_at', null);

    const inviteMember = async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        const role = formData.get("role") as string;
        if (!email) return;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Server-side auth check
        if (!user) return;

        const cookieStore = await cookies();
        const household_id = cookieStore.get('floupet_current_household_id')?.value;
        if (!household_id) return;

        await supabase.from('invitations').insert({
            household_id,
            email,
            role,
            invited_by: user.id
        });

        revalidatePath(`/${locale}/app/households/settings`);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-cream px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <div className="mb-10 text-center">
                    <h1 className="font-display text-4xl font-bold text-ink">
                        Membres du Foyer
                    </h1>
                    <p className="mt-2 text-sm text-gray">
                        Gérez les accès à votre foyer Floupet.
                    </p>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Membres Actuels */}
                    <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                        <h2 className="font-display text-xl font-bold text-ink mb-6">Membres Actuels</h2>
                        <ul className="flex flex-col gap-4">
                            {members?.map((m: any) => (
                                <li key={m.id} className="flex items-center justify-between border-b border-sand pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-bold text-ink">{m.profiles?.full_name || m.profiles?.email}</p>
                                    </div>
                                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
                                        {m.role}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Invitations en attente */}
                    {invitations && invitations.length > 0 && (
                        <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                            <h2 className="font-display text-xl font-bold text-ink mb-6">Invitations en attente</h2>
                            <ul className="flex flex-col gap-4">
                                {invitations.map((inv) => (
                                    <li key={inv.id} className="flex items-center justify-between border-b border-sand pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold text-ink">{inv.email}</p>
                                            <p className="text-xs text-gray-light mt-1">Lien: /fr/app/invite/{inv.token}</p>
                                        </div>
                                        <span className="rounded-full bg-coral-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-coral-dark">
                                            {inv.role}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Inviter un nouveau membre */}
                    <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                        <h2 className="font-display text-xl font-bold text-ink mb-6">Inviter un proche</h2>
                        <form action={inviteMember} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="text-[13px] font-bold text-ink-soft">Adresse Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="proche@email.com"
                                    required
                                    className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-teal focus:ring-4 focus:ring-teal-light"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="role" className="text-[13px] font-bold text-ink-soft">Rôle</label>
                                <select
                                    name="role"
                                    id="role"
                                    className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all focus:border-teal focus:ring-4 focus:ring-teal-light"
                                >
                                    <option value="member">Membre (Ajoute des logs)</option>
                                    <option value="admin">Admin (Gère les fiches animaux)</option>
                                    <option value="viewer">Observateur (Lecture seule)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-full bg-teal px-6 py-3.5 font-body text-[15px] font-bold text-ink shadow-[var(--shadow-teal)] transition-all hover:bg-teal-dark hover:text-white active:scale-95"
                            >
                                Envoyer l'invitation
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

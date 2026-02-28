import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AppLayout from "../../AppLayout";
import InviteMemberForm from "./InviteMemberForm";

export async function generateMetadata() {
    return { title: "Paramètres du foyer — Floupet" };
}

const ROLE_LABELS: Record<string, string> = {
    owner: "Propriétaire",
    admin: "Administrateur",
    member: "Membre",
    viewer: "Observateur",
};

const ROLE_COLORS: Record<string, string> = {
    owner: "bg-coral-light text-coral",
    admin: "bg-plum-light text-plum",
    member: "bg-teal-light text-teal-dark",
    viewer: "bg-sand text-gray",
};

export default async function HouseholdSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
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

    const userRole = membership?.role ?? '';
    const canManage = ['owner', 'admin'].includes(userRole);

    const { data: household } = await supabase
        .from('households')
        .select('id, name')
        .eq('id', currentHouseholdId)
        .single();

    const { data: members } = await supabase
        .from('memberships')
        .select('id, role, user_id, profiles(id, email, full_name, avatar_url)')
        .eq('household_id', currentHouseholdId)
        .order('role');

    const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('household_id', currentHouseholdId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

    return (
        <AppLayout locale={locale}>
            <div className="flex flex-col gap-8">
                <header>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                        {household?.name ?? 'Foyer'}
                    </h1>
                    <p className="text-sm text-gray-500">Paramètres et gestion des membres</p>
                </header>

                {/* Members list */}
                <section className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                    <h2 className="font-display text-xl font-bold text-ink mb-5">
                        Membres ({members?.length ?? 0})
                    </h2>
                    <ul className="flex flex-col divide-y divide-sand">
                        {members?.map((m: any) => {
                            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                            const isMe = m.user_id === user.id;
                            return (
                                <li key={m.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum font-display font-bold text-white text-sm">
                                            {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-ink truncate">
                                                {profile?.full_name || profile?.email || 'Inconnu'}
                                                {isMe && <span className="ml-2 text-xs font-normal text-gray-400">(vous)</span>}
                                            </p>
                                            {profile?.full_name && (
                                                <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ROLE_COLORS[m.role] ?? 'bg-sand text-gray'}`}>
                                        {ROLE_LABELS[m.role] ?? m.role}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/* Pending invitations */}
                {invitations && invitations.length > 0 && (
                    <section className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                        <h2 className="font-display text-xl font-bold text-ink mb-5">
                            Invitations en attente ({invitations.length})
                        </h2>
                        <ul className="flex flex-col divide-y divide-sand">
                            {invitations.map((inv) => (
                                <li key={inv.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-3">
                                    <div className="min-w-0">
                                        <p className="font-bold text-ink truncate">{inv.email}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Invité le {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ROLE_COLORS[inv.role] ?? 'bg-sand text-gray'}`}>
                                        {ROLE_LABELS[inv.role] ?? inv.role}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Invite form — only for owner/admin */}
                {canManage && <InviteMemberForm locale={locale} />}

                {!canManage && (
                    <p className="rounded-2xl bg-sand/50 p-4 text-sm text-gray-500 text-center">
                        Seuls les Propriétaires et Administrateurs peuvent inviter des membres.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import HouseholdSelector from "@/components/ui/HouseholdSelector";
import Link from "next/link";
import { cookies } from "next/headers";

import Logo from "@/components/ui/Logo";

export default async function AppLayout({
    children,
    locale,
}: {
    children: React.ReactNode;
    locale: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    // Check if profile is complete
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

    if (!profile?.full_name) {
        redirect(`/${locale}/app/onboarding/profile`);
    }

    // Check if user has any household
    const { data: memberships } = await supabase
        .from('memberships')
        .select('household_id, role, households!inner(id, name)')
        .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
        redirect(`/${locale}/app/households/new`);
    }

    // Support household switching via cookie
    const cookieStore = await cookies();
    const storedHouseholdId = cookieStore.get('floupet_current_household_id')?.value;

    let currentMembership = storedHouseholdId
        ? memberships.find(m => m.household_id === storedHouseholdId)
        : memberships[0];

    // If cookie was invalid, fallback
    if (!currentMembership) {
        currentMembership = memberships[0];
    }

    const currentHouseholdRaw = currentMembership.households;
    const currentHousehold = Array.isArray(currentHouseholdRaw) ? currentHouseholdRaw[0] : currentHouseholdRaw;
    const allHouseholds = memberships.map(m => Array.isArray(m.households) ? m.households[0] : m.households);

    return (
        <div className="flex min-h-screen bg-cream font-body text-ink">
            {/* Sidebar (Desktop) */}
            <aside className="hidden w-64 flex-col border-r border-sand bg-warm-white sm:flex">
                <div className="p-6">
                    <Link href={`/${locale}/app`} className="flex items-center gap-3">
                        <Logo size={40} />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-4">
                    {[
                        { href: `/${locale}/app`, label: "Home", icon: "🏠" },
                        { href: `/${locale}/app/pets`, label: "Animaux", icon: "🐾" },
                        { href: `/${locale}/app/feeding`, label: "Repas", icon: "🍽️" },
                        { href: `/${locale}/app/health`, label: "Santé", icon: "❤️" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all hover:bg-coral-light hover:text-coral"
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-sand p-4">
                    <HouseholdSelector
                        currentHousehold={currentHousehold}
                        households={allHouseholds}
                        locale={locale}
                    />
                </div>
            </aside>

            <div className="flex flex-1 flex-col">
                {/* TopBar (Mobile) */}
                <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-warm-white/80 p-4 backdrop-blur-lg sm:hidden">
                    <HouseholdSelector
                        currentHousehold={currentHousehold}
                        households={allHouseholds}
                        locale={locale}
                    />
                    <Link
                        href={`/${locale}/app/profile`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-plum font-display font-bold text-white shadow-[var(--shadow-md)]"
                    >
                        {profile.full_name?.charAt(0)}
                    </Link>
                </header>

                {/* Main Content */}
                <main className="flex-1 pb-24 pt-4 sm:p-8 sm:pb-8">
                    <div className="mx-auto max-w-5xl px-4">
                        {children}
                    </div>
                </main>
            </div>

            {/* Bottom Nav (Mobile) */}
            <BottomNav locale={locale} />
        </div>
    );
}

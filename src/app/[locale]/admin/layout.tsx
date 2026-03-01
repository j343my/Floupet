import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale });
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/app/auth`);
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.is_admin) {
        console.warn(`User ${user.id} attempted to access /admin without is_admin=true`);
        redirect(`/${locale}/app`);
    }

    return (
        <div className="flex min-h-screen bg-sand-light font-body text-ink">
            {/* Admin Sidebar */}
            <aside className="hidden w-64 flex-col border-r border-sand bg-warm-white sm:flex">
                <div className="p-6">
                    <Link href={`/${locale}/admin`} className="flex items-center gap-3">
                        <Logo size={32} />
                        <span className="font-bold text-coral">Admin</span>
                    </Link>
                </div>

                <nav className="flex flex-1 flex-col gap-2 p-4">
                    <Link
                        href={`/${locale}/admin`}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-ink transition-colors hover:bg-sand"
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        href={`/${locale}/admin/products`}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-ink transition-colors hover:bg-sand"
                    >
                        🥫 Produits
                    </Link>
                    <Link
                        href={`/${locale}/app`}
                        className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-gray-light transition-colors hover:bg-sand"
                    >
                        🔙 Quitter l'admin
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between border-b border-sand bg-warm-white px-4 sm:hidden">
                    <Link href={`/${locale}/admin`} className="flex items-center gap-2">
                        <Logo size={24} showText={false} />
                        <span className="font-display font-bold text-coral">Admin</span>
                    </Link>
                    <Link href={`/${locale}/app`} className="text-sm font-bold text-gray">
                        Quitter
                    </Link>
                </header>

                <div className="mx-auto max-w-5xl p-6 lg:p-10 mb-20 sm:mb-0">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav for Admin */}
            <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-sand bg-warm-white/80 p-2 backdrop-blur-md sm:hidden">
                <ul className="flex justify-around">
                    <li>
                        <Link href={`/${locale}/admin`} className="flex flex-col items-center gap-1 p-2 text-ink">
                            <span className="text-xl">📊</span>
                            <span className="text-[10px] font-bold">Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/admin/products`} className="flex flex-col items-center gap-1 p-2 text-ink">
                            <span className="text-xl">🥫</span>
                            <span className="text-[10px] font-bold">Produits</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

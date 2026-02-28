import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'household' });
    return { title: t('create') };
}

export default async function NewHouseholdPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "household" });
    const tc = await getTranslations({ locale, namespace: "common" });

    const createHousehold = async (formData: FormData) => {
        "use server";
        const name = formData.get("name") as string;
        if (!name) return;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect(`/${locale}/app/auth`);
        }

        // 1. Create the household
        const { data: household, error: householdError } = await supabase
            .from('households')
            .insert({ name })
            .select()
            .single();

        if (householdError || !household) {
            console.error("Failed to create household", householdError);
            // Handle error, for now we redirect back to new
            return redirect(`/${locale}/app/households/new?error=creation_failed`);
        }

        // 2. Add the user as owner
        const { error: membershipError } = await supabase
            .from('memberships')
            .insert({
                user_id: user.id,
                household_id: household.id,
                role: 'owner'
            });

        if (membershipError) {
            console.error("Failed to assign membership", membershipError);
        }

        // 3. Redirect to dashboard
        return redirect(`/${locale}/app`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-teal shadow-[var(--shadow-teal)] text-3xl">
                        🏡
                    </div>
                    <h1 className="font-display text-3xl font-bold text-ink">
                        {t("create")}
                    </h1>
                    <p className="mt-2 text-sm text-gray">
                        Donnez un nom à votre foyer pour commencer à suivre vos animaux.
                    </p>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-sand bg-white p-6 shadow-[var(--shadow-sm)]">
                    <form action={createHousehold} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name" className="text-[13px] font-bold text-ink-soft">
                                {t("name")}
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="..."
                                required
                                className="w-full rounded-[var(--radius-md)] border-2 border-sand-dark bg-white px-4 py-3 font-body text-[14px] text-ink outline-none transition-all placeholder:text-gray-light focus:border-teal focus:ring-4 focus:ring-teal-light"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-full bg-teal px-6 py-3.5 font-body text-[15px] font-bold text-ink shadow-[var(--shadow-teal)] transition-all hover:bg-teal-dark hover:text-white active:scale-95"
                        >
                            {tc("save")}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

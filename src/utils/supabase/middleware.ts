import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protection logic for the /app route segment
    // Only logged in users can access /app (except /app/auth)
    // We check `request.nextUrl.pathname`
    const isAppRoute = request.nextUrl.pathname.includes('/app') && !request.nextUrl.pathname.includes('/app/auth');

    if (isAppRoute && !user) {
        // Redirect to auth page (keeping locale if present, e.g. /fr/app/auth)
        const url = request.nextUrl.clone();
        url.pathname = url.pathname.replace('/app', '/app/auth');

        // Ensure we don't end up with /app/auth/auth
        if (url.pathname.endsWith('/auth/auth')) {
            url.pathname = url.pathname.replace('/auth/auth', '/auth');
        }

        return NextResponse.redirect(url);
    }

    // Auth users trying to access login page redirect to dashboard
    const isAuthPage = request.nextUrl.pathname.includes('/app/auth');
    if (isAuthPage && user) {
        const url = request.nextUrl.clone();
        url.pathname = url.pathname.replace('/app/auth', '/app');
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

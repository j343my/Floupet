import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n';
import { updateSession } from '@/utils/supabase/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
});

export default async function middleware(req: NextRequest) {
    // 1. Auth middleware (Supabase)
    const authResponse = await updateSession(req);

    // If Supabase triggered a redirect, we return it immediately
    if (authResponse.headers.get('location')) {
        return authResponse;
    }

    // 2. i18n middleware
    const intlResponse = intlMiddleware(req);

    // 3. Attach Supabase cookies to the final response
    authResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
    });

    return intlResponse;
}

export const config = {
    // Match all pathnames except for
    // - api routes
    // - _next (Next.js internals)
    // - static files (images, favicon, etc.)
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};

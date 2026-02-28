import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n';

export default createMiddleware({
    locales,
    defaultLocale,
    // Don't prefix the default locale in the URL
    localePrefix: 'as-needed',
});

export const config = {
    // Match all pathnames except for
    // - api routes
    // - _next (Next.js internals)
    // - static files (images, favicon, etc.)
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};

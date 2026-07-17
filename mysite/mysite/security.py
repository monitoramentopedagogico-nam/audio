from django.conf import settings


class ContentSecurityPolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        directives = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "media-src 'self' blob:",
            "connect-src 'self'",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ]
        if not settings.DEBUG:
            directives.append('upgrade-insecure-requests')
        response.headers.setdefault('Content-Security-Policy', '; '.join(directives))
        response.headers.setdefault(
            'Permissions-Policy',
            'camera=(self), microphone=(self), geolocation=(self)',
        )
        response.headers.setdefault('Referrer-Policy', 'same-origin')
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        return response

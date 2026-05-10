import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/sync/', '/settings/'],
      },
    ],
    sitemap: 'https://plusone-frontend-mu.vercel.app/sitemap.xml',
  }
}

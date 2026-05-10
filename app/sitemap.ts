import type { MetadataRoute } from 'next'

const BASE = 'https://plusone-frontend-mu.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/predictions`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/standings`,               lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/matches`,                 lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/predictions-feed`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/leagues`,                 lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/players`,                 lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/markets`,                 lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/head-to-head`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/home-away-split`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/performance`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/squad-stats`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/feedback`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]
}

import { load } from 'cheerio';
import type { ReferenceApp } from './types.js';

export const GOOGLE_PLAY_AWARDS_URL = 'https://blog.google/products-and-platforms/platforms/google-play/best-apps-games-2025/';
const SOURCE_YEAR = 2025;
const MAX_BYTES = 4 * 1024 * 1024;
const clean = (value: string): string => value.replace(/\s+/g, ' ').trim();
const label = (value: string): string => clean(value).replace(/:\s*$/, '');
const phoneCategories = new Set([
  'Best App', 'Best for Fun', 'Best for Personal Growth',
  'Best Everyday Essential', 'Best Hidden Gem', 'Best for Families',
]);

function allowedSource(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'blog.google' || url.username || url.password ||
      (url.port && url.port !== '443') ||
      !/^\/products-and-platforms\/platforms\/google-play\/best-apps-games-2025\/?$/.test(url.pathname)) {
    throw new Error('Google Play awards source must be the official HTTPS blog.google Best of 2025 announcement');
  }
  return url;
}

/** Extract only app recognitions in general phone-app categories from the dated U.S. listing. */
export function parseGooglePlayAwards(
  html: string,
  sourceUrl: string,
  observedAt: string,
): ReferenceApp[] {
  allowedSource(sourceUrl);
  if (!Number.isFinite(Date.parse(observedAt))) throw new Error('observedAt must be a valid timestamp');
  if (Buffer.byteLength(html, 'utf8') > MAX_BYTES) throw new Error('Google awards HTML exceeds the 4 MiB limit');
  const $ = load(html);
  const heading = clean($('article h1').first().text());
  if (!/Google Play/i.test(heading) || !/\b2025\b/.test(heading) || /\b202[046-9]\b/.test(heading)) {
    throw new Error('Google Play source does not declare the expected 2025 award year');
  }
  const apps = new Map<string, ReferenceApp>();
  let context: 'overall' | 'apps' | 'other' = 'other';
  $('article .rich-text h2, article .rich-text p, article .rich-text li').each((_index, node) => {
    const element = $(node);
    if (element.is('h2')) {
      const text = clean(element.text());
      if (!text) return;
      context = /^Best overall app and game$/i.test(text) ? 'overall'
        : /^Best apps of 2025$/i.test(text) ? 'apps' : 'other';
      return;
    }
    if (context === 'other') return;
    const category = label(element.find('b, strong').first().text());
    if (!phoneCategories.has(category)) return;
    if (context === 'overall' && category !== 'Best App') return;
    if (context === 'apps' && category === 'Best App') return;
    const link = element.find('a[href]').toArray().find((a) => {
      try {
        const url = new URL($(a).attr('href') ?? '', sourceUrl);
        return url.protocol === 'https:' && url.hostname === 'play.google.com' &&
          url.pathname === '/store/apps/details' && !!url.searchParams.get('id');
      } catch { return false; }
    });
    if (!link) return;
    const storeUrl = new URL($(link).attr('href')!, sourceUrl);
    const packageId = storeUrl.searchParams.get('id')!;
    if (!/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+$/.test(packageId)) return;
    const name = clean($(link).text());
    if (!name) return;
    const id = 'google-play-' + packageId;
    const award = { issuer: 'Google Play Best of (U.S.)', year: SOURCE_YEAR, category, status: 'winner', url: sourceUrl } as const;
    const existing = apps.get(id);
    if (existing) {
      if (!existing.awards.some((entry) => entry.category === category)) existing.awards.push(award);
      return;
    }
    apps.set(id, {
      id, name, platforms: ['android'], description: '',
      tags: ['awards-source-google-play', 'broad-app-award', 'region-us', String(SOURCE_YEAR), 'winner'],
      source: { provider: 'google-play-awards', url: sourceUrl, observedAt },
      awards: [award],
    });
  });
  return [...apps.values()];
}

export async function refreshGooglePlayAwards(
  input: { fetchFn?: typeof fetch } = {},
): Promise<{ apps: ReferenceApp[]; sourceUrl: string; observedAt: string; warnings: string[] }> {
  const fetchFn = input.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Google awards request timed out after 10 seconds')), 10_000);
  try {
    let sourceUrl = GOOGLE_PLAY_AWARDS_URL;
    let response: Response | undefined;
    for (let redirect = 0; redirect <= 3; redirect++) {
      allowedSource(sourceUrl);
      response = await fetchFn(sourceUrl, {
        signal: controller.signal, redirect: 'manual',
        headers: { accept: 'text/html', 'user-agent': 'mobile-design-mcp/0.1 (personal design reference research)' },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel().catch(() => {});
        if (!location) throw new Error('Google awards redirect has no Location');
        if (redirect === 3) throw new Error('Google awards redirect limit exceeded');
        sourceUrl = allowedSource(new URL(location, sourceUrl).href).href;
        continue;
      }
      break;
    }
    if (!response) throw new Error('Google awards response is unavailable');
    if (response.url && allowedSource(response.url).href !== allowedSource(sourceUrl).href) {
      throw new Error('Google awards fetch followed an unexpected redirect');
    }
    if (!response.ok) throw new Error('Google awards request failed with HTTP ' + response.status);
    if (!/^text\/html\b/i.test(response.headers.get('content-type') ?? '')) throw new Error('Google awards response is not HTML');
    if (Number(response.headers.get('content-length')) > MAX_BYTES) {
      controller.abort(); throw new Error('Google awards response exceeds the 4 MiB limit');
    }
    if (!response.body) throw new Error('Google awards response has no body');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) {
          controller.abort(); await reader.cancel().catch(() => {});
          throw new Error('Google awards response exceeds the 4 MiB limit');
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const observedAt = new Date().toISOString();
    const apps = parseGooglePlayAwards(Buffer.concat(chunks).toString('utf8'), sourceUrl, observedAt);
    if (!apps.length) throw new Error('No supported Android app recognitions found; the Google announcement may have changed');
    return {
      apps, sourceUrl, observedAt,
      warnings: [
        'Dated source: U.S. Google Play Best of 2025; this provider does not claim to discover the latest award year automatically.',
        'Google Play Best of is a broad app award, not a dedicated UI or motion design award.',
        'Only general app categories are included; games and awards specifically for watches, cars, large screens, XR or multi-device use are excluded.',
        'No screen captures, animation measurements or current app-version claims are derived from this award listing.',
      ],
    };
  } finally { clearTimeout(timer); }
}

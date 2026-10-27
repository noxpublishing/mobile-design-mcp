import { load } from 'cheerio';
import type { ReferenceApp } from './types.js';

const APPLE_URL = 'https://developer.apple.com/design/awards/';
const MAX_HTML_BYTES = 4 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;
const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();
const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function checkedYear(value: number | undefined): number | undefined {
  if (value !== undefined && (!Number.isInteger(value) || value < 1997 || value > 2100)) {
    throw new Error('year must be an integer between 1997 and 2100');
  }
  return value;
}

function appleUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'developer.apple.com' ||
      url.username || url.password || (url.port && url.port !== '443') ||
      !/^\/design\/awards(?:\/|$)/.test(url.pathname)) {
    throw new Error('Apple awards source must be an HTTPS developer.apple.com/design/awards/ URL');
  }
  return url;
}

/**
 * Parse the current public Apple Design Awards listing.
 * Only explicitly labelled Apps with iOS or iPadOS support enter this phone/tablet catalogue.
 * The resulting award describes the source year's app recognition, not its current UI version.
 */
export function parseAppleAwards(
  html: string,
  sourceUrl: string,
  observedAt: string,
  year?: number,
): ReferenceApp[] {
  appleUrl(sourceUrl);
  checkedYear(year);
  if (!Number.isFinite(Date.parse(observedAt))) throw new Error('observedAt must be a valid timestamp');
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) throw new Error('Apple awards HTML exceeds the 4 MiB limit');
  const $ = load(html);
  const headingText = normalize($('title').text()) + ' ' + normalize($('main h1, .section-header h1').first().text());
  const years = [...headingText.matchAll(/\b(20\d{2}|199[7-9])\b/g)].map((match) => Number(match[1]));
  const uniqueYears = [...new Set(years)];
  if (uniqueYears.length !== 1) throw new Error('Apple awards page does not declare one unambiguous award year');
  const sourceYear = uniqueYears[0];
  if (year !== undefined && year !== sourceYear) {
    throw new Error('Requested award year ' + year + ' differs from the current source year ' + sourceYear);
  }
  const apps = new Map<string, ReferenceApp>();
  $('section[id]').each((_sectionIndex, sectionNode) => {
    const section = $(sectionNode);
    const category = normalize(section.find('h1, h2').first().text());
    const anchor = section.attr('id');
    if (!category || !anchor) return;
    const categoryUrl = new URL(sourceUrl);
    categoryUrl.hash = anchor;
    let group: 'apps' | 'games' | undefined;
    section.find('h3, .finalist').each((_index, node) => {
      const element = $(node);
      if (element.is('h3')) {
        const heading = normalize(element.text()).toLowerCase();
        group = heading === 'apps' ? 'apps' : heading === 'games' ? 'games' : undefined;
        return;
      }
      if (group !== 'apps') return;
      const platformText = normalize(element.find('p.smaller, .platforms').first().text());
      if (!/(?:^|[,;\s])(?:iOS|iPadOS)(?=$|[,;\s])/.test(platformText)) return;
      const name = normalize(element.find('h4').first().text());
      const appHref = element.find('a[href]').toArray().map((a) => $(a).attr('href') ?? '').find((href) => {
        try { return new URL(href, sourceUrl).hostname === 'apps.apple.com' && /\/id\d+(?:$|[/?#])/.test(new URL(href, sourceUrl).pathname); }
        catch { return false; }
      });
      const appId = appHref ? /\/id(\d+)(?:$|[/?#])/.exec(new URL(appHref, sourceUrl).pathname)?.[1] : undefined;
      if (!name || !appId) return;
      const status = /\bwinner\b/i.test(normalize(element.find('.badge').text())) ? 'winner' : 'finalist';
      const description = element.find('p').toArray()
        .filter((p) => !$(p).is('.smaller, .platforms, .finalist-developer, .finalist-publisher'))
        .map((p) => normalize($(p).text()))
        .filter((text) => text && !/^Read more\b/i.test(text))
        .sort((a, b) => b.length - a.length)[0] ?? '';
      const id = 'apple-app-' + appId;
      const award = { issuer: 'Apple Design Awards', year: sourceYear, category, status, url: categoryUrl.href } as const;
      const existing = apps.get(id);
      if (existing) {
        if (!existing.awards.some((entry) => entry.year === sourceYear && entry.category === category)) existing.awards.push(award);
        existing.tags = [...new Set([...existing.tags, slug(category), status])];
      } else {
        apps.set(id, {
          id, name, platforms: ['ios'], description,
          tags: [slug(category), String(sourceYear), status],
          source: { provider: 'apple-design-awards', url: categoryUrl.href, observedAt },
          awards: [award],
        });
      }
    });
  });
  return [...apps.values()];
}

async function readBoundedBody(response: Response, controller: AbortController): Promise<string> {
  const declared = response.headers.get('content-length');
  if (declared !== null && Number.isFinite(Number(declared)) && Number(declared) > MAX_HTML_BYTES) {
    controller.abort();
    throw new Error('Apple awards response exceeds the 4 MiB limit');
  }
  if (!response.body) throw new Error('Apple awards response has no body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_HTML_BYTES) {
        controller.abort();
        await reader.cancel().catch(() => {});
        throw new Error('Apple awards response exceeds the 4 MiB limit');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    reader.releaseLock();
  }
}

export async function refreshAppleAwards(
  input: { year?: number; fetchFn?: typeof fetch } = {},
): Promise<{ apps: ReferenceApp[]; sourceUrl: string; observedAt: string; warnings: string[] }> {
  checkedYear(input.year);
  const fetchFn = input.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Apple awards request timed out after 10 seconds')), REQUEST_TIMEOUT_MS);
  try {
    let sourceUrl = APPLE_URL;
    let response: Response | undefined;
    // Redirects are checked before following: an off-domain Location is never requested.
    for (let redirect = 0; redirect <= 3; redirect++) {
      appleUrl(sourceUrl);
      response = await fetchFn(sourceUrl, {
        signal: controller.signal, redirect: 'manual',
        headers: { 'user-agent': 'mobile-design-mcp/0.1 (personal design reference research)', accept: 'text/html' },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel().catch(() => {});
        if (!location) throw new Error('Apple awards redirect has no Location header');
        if (redirect === 3) throw new Error('Apple awards redirect limit exceeded');
        sourceUrl = appleUrl(new URL(location, sourceUrl).href).href;
        continue;
      }
      break;
    }
    if (!response) throw new Error('Apple awards response is unavailable');
    if (response.url) {
      const actual = appleUrl(response.url);
      if (actual.href !== appleUrl(sourceUrl).href) throw new Error('Apple awards fetch followed an unexpected redirect');
    }
    if (!response.ok) throw new Error('Apple awards request failed with HTTP ' + response.status);
    const contentType = response.headers.get('content-type') ?? '';
    if (!/^text\/html\b/i.test(contentType)) throw new Error('Apple awards response is not HTML');
    const html = await readBoundedBody(response, controller);
    const observedAt = new Date().toISOString();
    const apps = parseAppleAwards(html, sourceUrl, observedAt, input.year);
    if (!apps.length) throw new Error('No supported iOS app awards found; the Apple listing may have changed');
    return {
      apps, sourceUrl, observedAt,
      warnings: [
        'Only explicitly listed iOS/iPadOS apps are included; games and other-only Apple platforms are excluded.',
        'Award year and category are source evidence, not proof that a current app version retains the awarded design.',
        'This listing does not provide measured transitions, screenshot captures, or original implementation code.',
      ],
    };
  } finally {
    clearTimeout(timer);
  }
}

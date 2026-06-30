// Lightweight client-side SEO helpers. The app is a single-URL SPA, so we keep
// <title>/<meta> in sync with the active in-app view and inject Schema.org data
// for blood centers once they load. Googlebot renders JS, so a JSON-LD <script>
// added to <head> at runtime is picked up by crawlers — this works on the
// statically-served Vercel domain where no server-side injection runs.

const SITE_NAME = 'Донор-Алерт';
const BASE_URL = 'https://donor-by.vercel.app';

type AppView = 'home' | 'dashboard' | 'privacy' | 'terms';

interface MetaEntry {
  title: string;
  description: string;
}

// Per-view metadata (RU). BY differs little for SEO, so we reuse RU copy for the
// title's tail but keep the dashboard private (noindex) regardless of language.
const META_BY_VIEW: Record<AppView, MetaEntry> = {
  home: {
    title: 'Донор-Алерт — оповещения о донорстве крови в Беларуси',
    description:
      'Сервис, который связывает доноров крови и центры переливания Беларуси: оповещения о нехватке крови, запись на донацию и учёт сдач.',
  },
  dashboard: {
    title: 'Личный кабинет — Донор-Алерт',
    description: 'Личный кабинет пользователя Донор-Алерт.',
  },
  privacy: {
    title: 'Политика конфиденциальности — Донор-Алерт',
    description: 'Как Донор-Алерт обрабатывает и защищает персональные данные пользователей.',
  },
  terms: {
    title: 'Пользовательское соглашение — Донор-Алерт',
    description: 'Условия использования сервиса Донор-Алерт.',
  },
};

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Sync document title + description/OG/Twitter tags with the active view. */
export function applyViewSeo(view: AppView) {
  const entry = META_BY_VIEW[view] ?? META_BY_VIEW.home;
  document.title = entry.title;

  setMetaTag('meta[name="description"]', 'name', 'description', entry.description);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', entry.title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', entry.description);
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', entry.title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', entry.description);

  // Keep private areas out of the index; the public landing stays indexable.
  const isPublic = view === 'home' || view === 'privacy' || view === 'terms';
  setMetaTag(
    'meta[name="robots"]',
    'name',
    'robots',
    isPublic ? 'index, follow, max-image-preview:large' : 'noindex, nofollow',
  );
}

interface CenterLike {
  name?: string;
  address?: string;
  phone?: string;
  email?: string | null;
  workingHours?: string | null;
  mapLink?: string | null;
}

/**
 * Inject (or refresh) an ItemList of BloodBank entries into <head>. Only meaningful
 * on the public landing; callers should pass an empty array to remove it elsewhere.
 */
export function applyCentersStructuredData(centers: CenterLike[]) {
  const id = 'ld-centers';
  const existing = document.getElementById(id);

  if (!centers || centers.length === 0) {
    if (existing) existing.remove();
    return;
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Центры переливания крови Беларуси',
    itemListElement: centers.map((c, i) => {
      const bloodBank: Record<string, unknown> = {
        '@type': 'BloodBank',
        name: c.name || SITE_NAME,
        address: {
          '@type': 'PostalAddress',
          streetAddress: c.address || '',
          addressCountry: 'BY',
        },
      };
      if (c.phone) bloodBank.telephone = c.phone;
      if (c.email) bloodBank.email = c.email;
      if (c.workingHours) bloodBank.openingHours = c.workingHours;
      if (c.mapLink) bloodBank.hasMap = c.mapLink;
      return { '@type': 'ListItem', position: i + 1, item: bloodBank };
    }),
  };

  const script = (existing as HTMLScriptElement) || document.createElement('script');
  script.id = id;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(itemList);
  if (!existing) document.head.appendChild(script);
}

export { BASE_URL, SITE_NAME };

import type { CmsContent } from './types';

export interface SeoCheck {
  id: string;
  label: string;
  status: 'good' | 'warning' | 'bad';
  message: string;
}

export interface SeoAnalysis {
  score: number; // 0-100
  rating: 'bad' | 'ok' | 'good';
  checks: SeoCheck[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0;
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(re) || []).length;
}

export function analyzeSeo(c: Partial<CmsContent>): SeoAnalysis {
  const checks: SeoCheck[] = [];
  const kp = (c.focus_keyphrase || '').trim().toLowerCase();
  const title = c.title || '';
  const slug = c.slug || '';
  const meta = c.meta_description || '';
  const metaTitle = c.meta_title || title;
  const bodyText = stripHtml(c.body_html || '');
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
  const firstPara = bodyText.slice(0, 200).toLowerCase();
  const h2s = (c.body_html || '').match(/<h2[^>]*>(.*?)<\/h2>/gi)?.join(' ').toLowerCase() || '';

  // Meta title length
  if (!metaTitle) checks.push({ id: 'mt', label: 'Meta title', status: 'bad', message: 'Add a meta title.' });
  else if (metaTitle.length < 30 || metaTitle.length > 60)
    checks.push({ id: 'mt', label: 'Meta title length', status: 'warning', message: `${metaTitle.length} chars — aim for 30-60.` });
  else checks.push({ id: 'mt', label: 'Meta title length', status: 'good', message: `${metaTitle.length} chars.` });

  // Meta description length
  if (!meta) checks.push({ id: 'md', label: 'Meta description', status: 'bad', message: 'Add a meta description.' });
  else if (meta.length < 70 || meta.length > 160)
    checks.push({ id: 'md', label: 'Meta description length', status: 'warning', message: `${meta.length} chars — aim for 70-160.` });
  else checks.push({ id: 'md', label: 'Meta description length', status: 'good', message: `${meta.length} chars.` });

  // Focus keyphrase
  if (!kp) {
    checks.push({ id: 'kp', label: 'Focus keyphrase', status: 'bad', message: 'Set a focus keyphrase.' });
  } else {
    checks.push({
      id: 'kp-title', label: 'Keyphrase in meta title',
      status: metaTitle.toLowerCase().includes(kp) ? 'good' : 'bad',
      message: metaTitle.toLowerCase().includes(kp) ? 'Found.' : 'Missing in meta title.',
    });
    checks.push({
      id: 'kp-slug', label: 'Keyphrase in slug',
      status: slug.toLowerCase().includes(kp.replace(/\s+/g, '-')) ? 'good' : 'warning',
      message: 'Should appear in the URL slug.',
    });
    checks.push({
      id: 'kp-meta', label: 'Keyphrase in meta description',
      status: meta.toLowerCase().includes(kp) ? 'good' : 'warning',
      message: meta.toLowerCase().includes(kp) ? 'Found.' : 'Missing in meta description.',
    });
    checks.push({
      id: 'kp-intro', label: 'Keyphrase in intro',
      status: firstPara.includes(kp) ? 'good' : 'warning',
      message: 'Should appear in the first paragraph.',
    });
    checks.push({
      id: 'kp-h2', label: 'Keyphrase in subheading',
      status: h2s.includes(kp) ? 'good' : 'warning',
      message: 'Use it in at least one H2.',
    });
    const occ = countOccurrences(bodyText.toLowerCase(), kp);
    const density = wordCount > 0 ? (occ / wordCount) * 100 : 0;
    checks.push({
      id: 'kp-density', label: 'Keyphrase density',
      status: density >= 0.5 && density <= 2.5 ? 'good' : density === 0 ? 'bad' : 'warning',
      message: `${density.toFixed(2)}% (target 0.5-2.5%).`,
    });
  }

  // Word count
  checks.push({
    id: 'wc', label: 'Content length',
    status: wordCount >= 300 ? 'good' : wordCount >= 150 ? 'warning' : 'bad',
    message: `${wordCount} words${wordCount < 300 ? ' — aim for 300+.' : '.'}`,
  });

  // Featured image alt
  if (c.featured_image_url) {
    checks.push({
      id: 'alt', label: 'Featured image alt text',
      status: (c.featured_image_alt || '').trim().length >= 5 ? 'good' : 'bad',
      message: (c.featured_image_alt || '').trim() ? 'Alt text set.' : 'Add descriptive alt text.',
    });
  } else {
    checks.push({ id: 'fi', label: 'Featured image', status: 'warning', message: 'Add a featured image.' });
  }

  // Slug
  checks.push({
    id: 'slug', label: 'Slug',
    status: slug.length > 0 && slug.length <= 75 ? 'good' : 'bad',
    message: slug ? `${slug.length} chars.` : 'Missing slug.',
  });

  const total = checks.length;
  const goods = checks.filter(c => c.status === 'good').length;
  const warns = checks.filter(c => c.status === 'warning').length;
  const score = Math.round(((goods + warns * 0.5) / total) * 100);
  const rating = score >= 75 ? 'good' : score >= 50 ? 'ok' : 'bad';
  return { score, rating, checks };
}

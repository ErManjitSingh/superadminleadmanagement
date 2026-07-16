const seoFields = {
  seoTitle: { type: String, default: '', trim: true },
  metaDescription: { type: String, default: '', trim: true },
  keywords: [{ type: String, trim: true }],
  canonical: { type: String, default: '', trim: true },
  ogTitle: { type: String, default: '', trim: true },
  ogDescription: { type: String, default: '', trim: true },
  ogImage: { type: String, default: '', trim: true },
  twitterCard: {
    type: String,
    enum: ['summary', 'summary_large_image', 'app', 'player'],
    default: 'summary_large_image',
  },
  twitterTitle: { type: String, default: '', trim: true },
  twitterDescription: { type: String, default: '', trim: true },
  twitterImage: { type: String, default: '', trim: true },
  schemaJson: { type: String, default: '' },
  robots: { type: String, default: 'index,follow', trim: true },
  noIndex: { type: Boolean, default: false },
  sitemapPriority: { type: Number, default: 0.5, min: 0, max: 1 },
  changeFrequency: {
    type: String,
    enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
    default: 'weekly',
  },
};

function pickSeo(doc = {}) {
  return {
    seoTitle: doc.seoTitle || '',
    metaDescription: doc.metaDescription || '',
    keywords: doc.keywords || [],
    canonical: doc.canonical || '',
    ogTitle: doc.ogTitle || '',
    ogDescription: doc.ogDescription || '',
    ogImage: doc.ogImage || '',
    twitterCard: doc.twitterCard || 'summary_large_image',
    twitterTitle: doc.twitterTitle || '',
    twitterDescription: doc.twitterDescription || '',
    twitterImage: doc.twitterImage || '',
    schemaJson: doc.schemaJson || '',
    robots: doc.robots || 'index,follow',
    noIndex: !!doc.noIndex,
    sitemapPriority: doc.sitemapPriority ?? 0.5,
    changeFrequency: doc.changeFrequency || 'weekly',
  };
}

const SEO_KEYS = Object.keys(seoFields);

module.exports = { seoFields, pickSeo, SEO_KEYS };

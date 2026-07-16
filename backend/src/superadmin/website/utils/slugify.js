function slugify(input = '') {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function uniqueSlug(Model, base, excludeId = null) {
  let slug = slugify(base) || 'item';
  let candidate = slug;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate, deletedAt: null };
    if (excludeId) query._id = { $ne: excludeId };
    // Some models may not have deletedAt
    const existing = await Model.findOne(
      excludeId ? { slug: candidate, _id: { $ne: excludeId } } : { slug: candidate },
    ).lean();
    if (!existing) return candidate;
    candidate = `${slug}-${i}`;
    i += 1;
    if (i > 500) throw new Error('Unable to generate unique slug');
  }
}

module.exports = { slugify, uniqueSlug };

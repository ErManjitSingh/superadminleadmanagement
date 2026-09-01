#!/usr/bin/env node
/**
 * Enable public website → CRM lead ingest for a company.
 *
 * Usage (from backend/):
 *   node src/scripts/enableWebsiteLeadIngest.js --slug=your-company-slug
 *   node src/scripts/enableWebsiteLeadIngest.js --domain=crm.exploremybharat.info
 *   node src/scripts/enableWebsiteLeadIngest.js --slug=foo --key=your-secret-key
 *
 * Prints the API key to put in form.php / env.
 */
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const Company = require('../superadmin/models/Company');

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : '';
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const slug = arg('slug').toLowerCase();
  const domain = arg('domain').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const key = arg('key') || crypto.randomBytes(24).toString('hex');
  const sourceLabel = arg('label') || 'Himachal Cab Website';
  const origins = (arg('origins') || 'https://himachalcabservice.in,https://www.himachalcabservice.in')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (!slug && !domain) {
    console.error('Provide --slug=company-slug or --domain=crm.example.com');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const filter = { deletedAt: null };
  if (slug) filter.slug = slug;
  if (domain) {
    filter.$or = [
      { primaryDomain: domain },
      { 'additionalDomains.domain': domain },
      { subdomain: domain.split('.')[0] },
    ];
  }

  const company = await Company.findOne(filter);
  if (!company) {
    console.error('Company not found for', { slug, domain });
    process.exit(1);
  }

  company.websiteLeadIngest = {
    enabled: !hasFlag('disable'),
    apiKey: key,
    sourceLabel,
    allowedOrigins: origins,
  };
  await company.save();

  console.log('Updated company:', company.name);
  console.log('  slug:', company.slug);
  console.log('  enabled:', company.websiteLeadIngest.enabled);
  console.log('  sourceLabel:', sourceLabel);
  console.log('  allowedOrigins:', origins.join(', '));
  console.log('');
  console.log('Use this in form.php / CRM env:');
  console.log('  API URL: POST https://crm.exploremybharat.info/api/public/leads');
  console.log('  X-Lead-Key:', key);
  console.log('');
  console.log('Or set backend .env:');
  console.log(`  WEBSITE_LEAD_API_KEY=${key}`);
  console.log(`  WEBSITE_LEAD_COMPANY_SLUG=${company.slug}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Run on VPS: node src/scripts/vpsEnableLeadIngestOnce.js <apiKey>
 * Enables websiteLeadIngest on the best-matching company and patches .env
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const Company = require('../superadmin/models/Company');

const KEY = process.argv[2];
if (!KEY) {
  console.error('Usage: node src/scripts/vpsEnableLeadIngestOnce.js <apiKey>');
  process.exit(1);
}

function upsertEnv(envPath, updates) {
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = env.split(/\r?\n/);
  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const eq = line.indexOf('=');
    const key = eq >= 0 ? line.slice(0, eq) : null;
    if (key && Object.prototype.hasOwnProperty.call(updates, key)) {
      out.push(`${key}=${updates[key]}`);
      seen.add(key);
    } else if (key === 'CORS_ORIGINS') {
      const current = line.slice(eq + 1);
      const parts = current.split(',').map((s) => s.trim()).filter(Boolean);
      for (const origin of [
        'https://himachalcabservice.in',
        'https://www.himachalcabservice.in',
        'https://crm.exploremybharat.info',
      ]) {
        if (!parts.includes(origin)) parts.push(origin);
      }
      out.push(`CORS_ORIGINS=${parts.join(',')}`);
    } else {
      out.push(line);
    }
  }

  for (const [k, v] of Object.entries(updates)) {
    if (!seen.has(k)) out.push(`${k}=${v}`);
  }

  fs.writeFileSync(envPath, `${out.join('\n').replace(/\n+$/, '')}\n`);
}

async function main() {
  await mongoose.connect(mongoUri);
  const companies = await Company.find({ deletedAt: null })
    .select('name slug subdomain primaryDomain additionalDomains status')
    .lean();

  console.log('companies:', JSON.stringify(companies, null, 2));
  if (!companies.length) {
    console.error('NO_COMPANIES in MongoDB');
    process.exit(2);
  }

  const company =
    companies.find((c) => String(c.primaryDomain || '').includes('exploremybharat')) ||
    companies.find((c) =>
      (c.additionalDomains || []).some((d) => String(d.domain || '').includes('exploremybharat'))
    ) ||
    companies.find((c) => /bharat|himachal|explore/i.test(`${c.slug} ${c.name} ${c.subdomain || ''}`)) ||
    companies[0];

  console.log('Using company:', company.name, '| slug:', company.slug);

  await Company.updateOne(
    { _id: company._id },
    {
      $set: {
        websiteLeadIngest: {
          enabled: true,
          apiKey: KEY,
          sourceLabel: 'Himachal Cab Website',
          allowedOrigins: [
            'https://himachalcabservice.in',
            'https://www.himachalcabservice.in',
          ],
        },
      },
    }
  );

  const envPath = path.resolve(__dirname, '../../.env');
  upsertEnv(envPath, {
    WEBSITE_LEAD_API_KEY: KEY,
    WEBSITE_LEAD_COMPANY_SLUG: company.slug,
    WEBSITE_LEAD_SOURCE_LABEL: 'Himachal Cab Website',
    WEBSITE_LEAD_ALLOWED_ORIGINS:
      'https://himachalcabservice.in,https://www.himachalcabservice.in',
  });

  console.log('ENABLED ok');
  console.log('API key set in company + .env');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

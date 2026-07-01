const dns = require("dns").promises;
const Company = require("../superadmin/models/Company");
const { slugify } = require("../superadmin/services/companyProvisioningService");
const { RESERVED_SUBDOMAINS } = require("../services/tenantResolveService");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { platformDomain } = require("../config/branding");

const APP_CNAME_TARGET =
  process.env.APP_CNAME_TARGET || `proxy.${platformDomain}`;
const SERVER_IP = process.env.SERVER_IP || process.env.VPS_IP || "";

function normalizeSubdomain(value) {
  return slugify(value);
}

function normalizeDomain(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

const checkSubdomain = asyncHandler(async (req, res) => {
  const raw = req.params.subdomain;
  const subdomain = normalizeSubdomain(raw);

  if (!subdomain || subdomain.length < 2) {
    return res.json({
      data: { available: false, subdomain, reason: "Too short" },
    });
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return res.json({
      data: { available: false, subdomain, reason: "Reserved" },
    });
  }

  const taken = await Company.findOne({ subdomain, deletedAt: null }).lean();
  res.json({
    data: {
      available: !taken,
      subdomain,
      url: `${subdomain}.${platformDomain}`,
      reason: taken ? "Already taken" : null,
    },
  });
});

async function domainPointsToPlatform(hostname) {
  const host = normalizeDomain(hostname);
  if (!host) return { verified: false, method: null };

  try {
    const cnames = await dns.resolveCname(host);
    const match = cnames.some(
      (c) =>
        normalizeDomain(c) === normalizeDomain(APP_CNAME_TARGET) ||
        normalizeDomain(c).endsWith(`.${normalizeDomain(APP_CNAME_TARGET)}`),
    );
    if (match) return { verified: true, method: "CNAME", records: cnames };
  } catch {
    /* try A record */
  }

  if (SERVER_IP) {
    try {
      const addresses = await dns.resolve4(host);
      if (addresses.includes(SERVER_IP)) {
        return { verified: true, method: "A", records: addresses };
      }
    } catch {
      /* not verified */
    }
  }

  return { verified: false, method: null };
}

const getDomainDnsInfo = asyncHandler(async (req, res) => {
  res.json({
    data: {
      platformDomain,
      cnameTarget: APP_CNAME_TARGET,
      serverIp: SERVER_IP || null,
      instructions: {
        cname: { host: "crm", pointsTo: APP_CNAME_TARGET },
        aRecord: SERVER_IP ? { host: "crm", pointsTo: SERVER_IP } : null,
      },
    },
  });
});

const verifyDomain = asyncHandler(async (req, res) => {
  const domain = normalizeDomain(req.body?.domain);
  if (!domain) throw new ApiError(400, "Domain is required");

  const taken = await Company.findOne({
    primaryDomain: domain,
    deletedAt: null,
  }).lean();
  if (taken) {
    return res.json({
      data: {
        domain,
        verified: false,
        status: "unavailable",
        message: "This domain is already registered to another company",
      },
    });
  }

  const result = await domainPointsToPlatform(domain);
  res.json({
    data: {
      domain,
      verified: result.verified,
      status: result.verified ? "verified" : "pending",
      method: result.method,
      records: result.records || [],
      expected: {
        cname: APP_CNAME_TARGET,
        aRecord: SERVER_IP || null,
      },
    },
  });
});

module.exports = {
  checkSubdomain,
  getDomainDnsInfo,
  verifyDomain,
  domainPointsToPlatform,
  normalizeDomain,
};

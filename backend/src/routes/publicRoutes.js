const express = require("express");
const {
  listPublicPlans,
  publicSignup,
} = require("../controllers/publicSignupController");
const {
  checkSubdomain,
  getDomainDnsInfo,
  verifyDomain,
} = require("../controllers/publicDomainController");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/plans", listPublicPlans);
router.get("/domain/dns-info", getDomainDnsInfo);
router.get("/subdomain/:subdomain/check", checkSubdomain);
router.post("/domain/verify", verifyDomain);
router.post("/signup", authLimiter, publicSignup);

module.exports = router;

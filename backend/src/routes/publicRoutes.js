const express = require("express");
const {
  listPublicPlans,
  publicSignup,
} = require("../controllers/publicSignupController");
const {
  verifyEmail,
  resendVerification,
} = require("../controllers/publicEmailVerificationController");
const {
  checkSubdomain,
  getDomainDnsInfo,
  verifyDomain,
} = require("../controllers/publicDomainController");
const {
  getVendorConfirm,
  postVendorConfirm,
} = require("../controllers/vendorConfirmationController");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/plans", listPublicPlans);
router.get("/domain/dns-info", getDomainDnsInfo);
router.get("/subdomain/:subdomain/check", checkSubdomain);
router.post("/domain/verify", verifyDomain);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/signup", authLimiter, publicSignup);
router.get("/vendor-confirm/:token", getVendorConfirm);
router.post("/vendor-confirm/:token", postVendorConfirm);

module.exports = router;

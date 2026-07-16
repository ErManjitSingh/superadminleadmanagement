const express = require('express');
const pub = require('../controllers/publicController');

const router = express.Router();

router.get('/homepage', pub.getPublicHomepage);
router.get('/treks', pub.listPublicTreks);
router.get('/treks/:slug', pub.getPublicTrek);
router.get('/destinations', pub.listPublicDestinations);
router.get('/destinations/:slug', pub.getPublicDestination);
router.get('/categories', pub.listPublicCategories);
router.get('/blogs', pub.listPublicBlogs);
router.get('/blogs/:slug', pub.getPublicBlog);
router.get('/testimonials', pub.listPublicTestimonials);
router.get('/faqs', pub.listPublicFaqs);
router.get('/galleries', pub.listPublicGalleries);
router.get('/menus', pub.getPublicMenus);
router.get('/settings', pub.getPublicSettings);
router.get('/seo', pub.getPublicSeo);
router.get('/seo/:pageKey', pub.getPublicSeo);
router.get('/redirects/resolve', pub.resolveRedirect);
router.get('/sitemap', pub.getSitemap);
router.get('/coupons/validate', pub.validateCoupon);
router.post('/coupons/validate', pub.validateCoupon);
router.post('/leads', pub.submitLead);
router.post('/reviews', pub.submitReview);
router.post('/analytics/visit', pub.trackVisit);

module.exports = router;

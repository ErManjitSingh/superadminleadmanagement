const express = require('express');
const { superAdminProtect } = require('../../middleware/superAdminAuth');
const { requireWebsitePermission } = require('../middleware/requireWebsitePermission');

const dashboard = require('../controllers/dashboardController');
const homepage = require('../controllers/homepageController');
const treks = require('../controllers/trekController');
const destinations = require('../controllers/destinationController');
const categories = require('../controllers/categoryController');
const blogs = require('../controllers/blogController');
const media = require('../controllers/mediaController');
const content = require('../controllers/contentControllers');
const menus = require('../controllers/menuController');
const leads = require('../controllers/leadController');
const settings = require('../controllers/settingsController');
const seo = require('../controllers/seoController');
const activity = require('../controllers/activityController');
const reviews = require('../controllers/reviewController');

const router = express.Router();
router.use(superAdminProtect);

router.get('/dashboard', requireWebsitePermission('dashboard', 'view'), dashboard.getDashboard);
router.post('/dashboard/analytics', requireWebsitePermission('dashboard', 'edit'), dashboard.recordAnalytics);

router.get('/homepage', requireWebsitePermission('homepage', 'view'), homepage.listSections);
router.post('/homepage/reorder', requireWebsitePermission('homepage', 'edit'), homepage.reorderSections);
router.post('/homepage', requireWebsitePermission('homepage', 'create'), homepage.upsertSection);
router.get('/homepage/:id', requireWebsitePermission('homepage', 'view'), homepage.getSection);
router.patch('/homepage/:id', requireWebsitePermission('homepage', 'edit'), homepage.upsertSection);
router.delete('/homepage/:id', requireWebsitePermission('homepage', 'delete'), homepage.deleteSection);

router.get('/treks', requireWebsitePermission('treks', 'view'), treks.listTreks);
router.post('/treks/reorder', requireWebsitePermission('treks', 'edit'), treks.reorderTreks);
router.post('/treks', requireWebsitePermission('treks', 'create'), treks.createTrek);
router.get('/treks/:id', requireWebsitePermission('treks', 'view'), treks.getTrek);
router.patch('/treks/:id', requireWebsitePermission('treks', 'edit'), treks.updateTrek);
router.delete('/treks/:id', requireWebsitePermission('treks', 'delete'), treks.deleteTrek);
router.post('/treks/:id/duplicate', requireWebsitePermission('treks', 'create'), treks.duplicateTrek);
router.post('/treks/:id/schedule', requireWebsitePermission('treks', 'publish'), treks.schedulePublishTrek);
router.post('/treks/:id/archive', requireWebsitePermission('treks', 'edit'), treks.archiveTrek);

router.get('/destinations', requireWebsitePermission('destinations', 'view'), destinations.listDestinations);
router.post('/destinations/reorder', requireWebsitePermission('destinations', 'edit'), destinations.reorderDestinations);
router.post('/destinations', requireWebsitePermission('destinations', 'create'), destinations.createDestination);
router.get('/destinations/:id', requireWebsitePermission('destinations', 'view'), destinations.getDestination);
router.patch('/destinations/:id', requireWebsitePermission('destinations', 'edit'), destinations.updateDestination);
router.delete('/destinations/:id', requireWebsitePermission('destinations', 'delete'), destinations.deleteDestination);
router.post('/destinations/:id/duplicate', requireWebsitePermission('destinations', 'create'), destinations.duplicateDestination);

router.get('/categories', requireWebsitePermission('categories', 'view'), categories.listCategories);
router.post('/categories/reorder', requireWebsitePermission('categories', 'edit'), categories.reorderCategories);
router.post('/categories', requireWebsitePermission('categories', 'create'), categories.createCategory);
router.get('/categories/:id', requireWebsitePermission('categories', 'view'), categories.getCategory);
router.patch('/categories/:id', requireWebsitePermission('categories', 'edit'), categories.updateCategory);
router.delete('/categories/:id', requireWebsitePermission('categories', 'delete'), categories.deleteCategory);

router.get('/blogs', requireWebsitePermission('blogs', 'view'), blogs.listBlogs);
router.post('/blogs/reorder', requireWebsitePermission('blogs', 'edit'), blogs.reorderBlogs);
router.post('/blogs', requireWebsitePermission('blogs', 'create'), blogs.createBlog);
router.get('/blogs/:id', requireWebsitePermission('blogs', 'view'), blogs.getBlog);
router.patch('/blogs/:id', requireWebsitePermission('blogs', 'edit'), blogs.updateBlog);
router.delete('/blogs/:id', requireWebsitePermission('blogs', 'delete'), blogs.deleteBlog);
router.post('/blogs/:id/duplicate', requireWebsitePermission('blogs', 'create'), blogs.duplicateBlog);
router.post('/blogs/:id/autosave', requireWebsitePermission('blogs', 'edit'), blogs.autoSaveBlog);
router.post('/blogs/:id/revisions/:revisionId/restore', requireWebsitePermission('blogs', 'edit'), blogs.restoreBlogRevision);

router.get('/media', requireWebsitePermission('media', 'view'), media.listMedia);
router.post('/media/upload', requireWebsitePermission('media', 'create'), media.uploadMedia);
router.post('/media/folders', requireWebsitePermission('media', 'create'), media.createFolder);
router.post('/media/bulk-delete', requireWebsitePermission('media', 'delete'), media.bulkDeleteMedia);
router.get('/media/:id', requireWebsitePermission('media', 'view'), media.getMedia);
router.patch('/media/:id', requireWebsitePermission('media', 'edit'), media.updateMedia);
router.delete('/media/:id', requireWebsitePermission('media', 'delete'), media.deleteMedia);

router.get('/galleries', requireWebsitePermission('gallery', 'view'), content.listGalleries);
router.post('/galleries/reorder', requireWebsitePermission('gallery', 'edit'), content.reorderGalleries);
router.post('/galleries', requireWebsitePermission('gallery', 'create'), content.createGallery);
router.get('/galleries/:id', requireWebsitePermission('gallery', 'view'), content.getGallery);
router.patch('/galleries/:id', requireWebsitePermission('gallery', 'edit'), content.updateGallery);
router.delete('/galleries/:id', requireWebsitePermission('gallery', 'delete'), content.deleteGallery);

router.get('/testimonials', requireWebsitePermission('testimonials', 'view'), content.listTestimonials);
router.post('/testimonials/reorder', requireWebsitePermission('testimonials', 'edit'), content.reorderTestimonials);
router.post('/testimonials', requireWebsitePermission('testimonials', 'create'), content.createTestimonial);
router.get('/testimonials/:id', requireWebsitePermission('testimonials', 'view'), content.getTestimonial);
router.patch('/testimonials/:id', requireWebsitePermission('testimonials', 'edit'), content.updateTestimonial);
router.delete('/testimonials/:id', requireWebsitePermission('testimonials', 'delete'), content.deleteTestimonial);

router.get('/faqs', requireWebsitePermission('faqs', 'view'), content.listFaqs);
router.post('/faqs/reorder', requireWebsitePermission('faqs', 'edit'), content.reorderFaqs);
router.post('/faqs', requireWebsitePermission('faqs', 'create'), content.createFaq);
router.get('/faqs/:id', requireWebsitePermission('faqs', 'view'), content.getFaq);
router.patch('/faqs/:id', requireWebsitePermission('faqs', 'edit'), content.updateFaq);
router.delete('/faqs/:id', requireWebsitePermission('faqs', 'delete'), content.deleteFaq);

router.get('/menus', requireWebsitePermission('menus', 'view'), menus.listMenus);
router.get('/menus/:id', requireWebsitePermission('menus', 'view'), menus.getMenu);
router.patch('/menus/:id', requireWebsitePermission('menus', 'edit'), menus.updateMenu);

router.get('/seo', requireWebsitePermission('seo', 'view'), seo.listSeoPages);
router.post('/seo/sync', requireWebsitePermission('seo', 'edit'), seo.syncFromContent);
router.post('/seo', requireWebsitePermission('seo', 'create'), seo.upsertSeoPage);
router.get('/seo/:id', requireWebsitePermission('seo', 'view'), seo.getSeoPage);
router.patch('/seo/:id', requireWebsitePermission('seo', 'edit'), seo.upsertSeoPage);
router.delete('/seo/:id', requireWebsitePermission('seo', 'delete'), seo.deleteSeoPage);

router.get('/leads/export', requireWebsitePermission('leads', 'export'), leads.exportLeads);
router.get('/leads', requireWebsitePermission('leads', 'view'), leads.listLeads);
router.get('/leads/:id', requireWebsitePermission('leads', 'view'), leads.getLead);
router.patch('/leads/:id', requireWebsitePermission('leads', 'edit'), leads.updateLead);
router.post('/leads/:id/assign', requireWebsitePermission('leads', 'edit'), leads.assignLead);
router.delete('/leads/:id', requireWebsitePermission('leads', 'delete'), leads.deleteLead);

router.get('/reviews', requireWebsitePermission('testimonials', 'view'), reviews.listReviews);
router.patch('/reviews/:id', requireWebsitePermission('testimonials', 'edit'), reviews.moderateReview);
router.delete('/reviews/:id', requireWebsitePermission('testimonials', 'delete'), reviews.deleteReview);

router.get('/coupons', requireWebsitePermission('coupons', 'view'), content.listCoupons);
router.post('/coupons', requireWebsitePermission('coupons', 'create'), content.createCoupon);
router.get('/coupons/:id', requireWebsitePermission('coupons', 'view'), content.getCoupon);
router.patch('/coupons/:id', requireWebsitePermission('coupons', 'edit'), content.updateCoupon);
router.delete('/coupons/:id', requireWebsitePermission('coupons', 'delete'), content.deleteCoupon);

router.get('/settings', requireWebsitePermission('settings', 'view'), settings.getSettings);
router.patch('/settings', requireWebsitePermission('settings', 'edit'), settings.updateSettings);

router.get('/redirects', requireWebsitePermission('redirects', 'view'), content.listRedirects);
router.post('/redirects', requireWebsitePermission('redirects', 'create'), content.createRedirect);
router.get('/redirects/:id', requireWebsitePermission('redirects', 'view'), content.getRedirect);
router.patch('/redirects/:id', requireWebsitePermission('redirects', 'edit'), content.updateRedirect);
router.delete('/redirects/:id', requireWebsitePermission('redirects', 'delete'), content.deleteRedirect);

router.get('/activity', requireWebsitePermission('activity', 'view'), activity.listActivity);

module.exports = router;

const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// U ovom slucaju, ne trebamo pisati router.route jer samo zelimo da routamo na get()

// Stavimo iznad protectane rute, jer ne zelimo da runnamo i .protect i .isLoggedIn posto su gotovo ista stvar
router.get('/me', authController.protect, viewController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData,
);
router.get(
  '/my-bookings',
  authController.protect,
  viewController.getMyBookings,
);

// Ako je user logovan (imamo jwt cookie), onda ce biti dostupan u pug templates kroz res.locals
router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingController.createBookingCheckout,
  viewController.getOverview,
);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLoginPage);

module.exports = router;

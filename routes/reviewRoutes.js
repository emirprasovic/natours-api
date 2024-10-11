const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// Protect ALL Review Routes
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReivew,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    // reviewController.updateReviewMid,
    reviewController.updateReview,
  )
  .get(reviewController.getReview);

module.exports = router;

/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout); // da bismo izbrisali cookie na frontendu
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// DODAJE SE PROTECT MIDDLEWARE NA SVE RUTE POSLIJE OVE. Zapamtiti: middleware runs in sequence
router.use(authController.protect);

router.patch('/update-my-password', authController.updatePassword);
router.patch(
  '/update-me',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/delete-me', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

// RESTRICT ONLY TO ADMIN
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

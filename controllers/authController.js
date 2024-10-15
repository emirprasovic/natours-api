/* eslint-disable arrow-body-style */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION_TIME,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Da nam ne outputa password
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  // const token = signToken(newUser._id);

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password are passed
  if (!email || !password) {
    return next(new AppError('Please provide an email and a password', 400));
  }

  // 2) Check if user exists && if password is correct
  const user = await User.findOne({ email: email })
    .select('+password')
    .select('+failedLoginAttempts');
  // U slucaju da nemamo usera, onda ce nam linija ispod failati, pa smo je premjestili u if()
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    // 2.1) Ako ovjde imamo usera, onda znaci da sifra ne valja (failedLogin)
    if (user) {
      // 2.2) Ako smo failali login, ponovo moramo vidjeti da li je user vec locked
      if (user.isLocked) {
        const timeleft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        return next(
          new AppError(`You cannot log in. Try again in ${timeleft} minutes`),
        );
      }
      // 2.3) Ako user vec nije lockan, povecamo counter za failedLogins
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= process.env.MAX_LOGIN_ATTEMPTS) {
        // 2.4) Ako user vec deseti put faila login, staviti da je lockedUntil 10 minuta od ovog trenutka
        user.lockUntil =
          Date.now() + 1000 * 60 * process.env.LOGIN_COOLDOWN_TIME_MINUTES;
        // 2.5) Kad lockamo usera, onda mu svaki naredni put dajemo samo 3 pokusaja prije neko sto ga ponovo zakljucamo
        user.failedLoginAttempts -= 3;
      }
      // 2.6) Saveamo usera kako bismo updateali failedLoginAttempts i lockedUntil
      await user.save({ validateBeforeSave: false });
    }

    return next(new AppError(`Incorrect email or password`, 400));
  }

  // 3) Ako ukucamo ispravnu sifru, ponovo provjerimo da li je user lockan
  if (user.isLocked) {
    const timeleft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
    return next(
      new AppError(`You cannot log in. Try again in ${timeleft} minutes`),
    );
  }
  // 4) Login uspjesan, restartujemo counter i saveamo usera
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  // 5) Success, send token to client
  createAndSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.clearCookie('jwt');

  // OVAJ KOD ISPOD MI BACI ERROR DOK IMAMO COOKIE (JWT MALFORMED ERROR), PA SMO SAMO CLEARALI COOKIE
  // res.cookie('jwt', 'loggedout', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }

  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to the token no longer exists', 401),
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password. Please log in again', 401),
    );

  // ACCESS TO PROTECTED ROUTE, svaki middleware koji dodje poslije ovog imat ce u requestu usera
  req.user = currentUser;
  // For templates
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError('There is no user with that email address', 404));

  // 2) Generate random token
  const resetToken = user.createPasswordResetToken();

  // 3) Store the token and the expiration date in the database (so we can compare it)
  await user.save({ validateBeforeSave: false });

  // 4) Send it to the user's email

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(err);
    return next(
      new AppError('There was an error sending the email. Try again', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Set new password if token is not expired, and there is an user
  if (!user) return next(new AppError('Token is invalid or expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user
  const user = await User.findById(req.user.id).select('+password');

  // Suvisno, jer ovo vec provjeravamo u protect middleware-u
  // if (!user) return next(new AppError('You are not logged in', 401));
  // console.log(user);

  // 2) Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Incorrect password', 401));
  // 3) If the password is correct, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Zelimo da validateamo password!!! takodjer smo proslijedili passwordConfirm u req body
  // await user.save({ validateBeforeSave: false });

  // 4) Log user in, send JWT
  createAndSendToken(user, 200, res);
});

// Only for rendered pages
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    res.locals.user = currentUser;
    return next();
  }
  next();
});

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data
  const tours = await Tour.find();

  // 2) Build template
  // 3) Render template with tour data

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data, including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) return next(new AppError('Cannot find tour with that name', 404));

  // console.log(tour);
  // 2) Build template

  // 3) Render template with tour data

  res.status(200).render('tour', {
    tour,
    title: tour.name,
  });
});

exports.getLoginPage = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login',
  });
};

exports.getAccount = (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  // Morali smo koristiti app.use(express.urlencoded({ extended: true, limit: '10kb' })); za ovu rutu
  // console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  // Takodjer smo mogli i staviti res.locals.user = updatedUser, isto bi radilo
  // Ovako samo ogranicimo da je updateani user dostupan samo "account" page-u, jer svavako svaki put kad mi reloadamo/otvorimo drugi page
  // runna se isLoggedIn middleware i on updatea usera
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

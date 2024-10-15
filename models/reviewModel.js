const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please specify the review'],
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to an user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
  },
  {
    // Virtual properties show up in JSON and Object properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  //   this.populate({
  //     path: 'tour',
  //   });
  next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  // this -> model [ Review.calcAverageRating ]
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  // Ako izbrisemo zadnji review, onda nam ovaj aggregation vraca prazan array [] jer ne moze da nadje match. Zbog toga moramo provjeriti stats.length
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].numRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 3.47,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post('save', function () {
  // this -> current document

  // Posto nemamo "Review" ovdje definisan, koristimo konstruktor od trenutnog dokumenta, sto je zapravo model (Review)
  // Review.calcAverageRating(this.tour);

  this.constructor.calcAverageRating(this.tour);
  // next();
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
  // Moramo awaitati jer se hook moze zavrsiti prije funkcije
  if (doc) await doc.constructor.calcAverageRating(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

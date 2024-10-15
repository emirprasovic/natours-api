/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please specify your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'please specify your email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please specify your password'],
    minlength: [8, 'Password must be longer than 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        // val = passwordConfirm
        // this only runs on CREATE and SAVE. does not run on upadteOne...
        return this.password === val;
      },
      message: 'Please repeat your password correctly',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: Date,
});

userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.pre('save', async function (next) {
  // "this" pointa na trenutni dokument koji hocemo da signin-amo. Ako sifra nije promijenjena, onda ne zelimo da je ponovo hasiramo. A kada ne bi bila promijenjena ako saveamo usera? Npr. kada ga PATCHamo ili PUTamo, i samo mu promijenimo ime.
  if (!this.isModified('password')) return next();

  // 12 = salt, 10 je default, specificiramo koliko cpu intensive zelimo da enkripcija bude
  this.password = await bcrypt.hash(this.password, 12);
  // ne zelimo da u bazu unosimo passowrdConfirm, pa ga samo stavimo da je undefined, i on se nece persistat
  this.passwordConfirm = undefined;
  // predjemo na slijedeci middleware
  next();
});

userSchema.pre('save', function (next) {
  // passwordChangedAt property zelimo da deklarisemo samo kad smo promijenili sifru, i kad nas dokument nije nov. Ako smo se tek signin-ali, nas password jeste modified, ali ga tehnicki nismo promijenili
  if (!this.isModified('password') || this.isNew) return next();

  // Oduzimamo jednu sekundu, jer nekad se zna desit da ce se nas token napraviti malo prije nego sto stavimo ovaj pwdChangedAt. To onda znaci da smo promijenili password nakon sto smo se logovali, sto ne zelimo U authControlleru u resetPassword, odmah nakon sto smo uradili user.save, napravili smo novi token
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware za svaki query koji pocinje sa "find"
// Koristimo query middleware kako bismo iskljucili usere koji nisu aktivni (tj deletani)
userSchema.pre(/^find/, function (next) {
  // "this" -> current query
  this.find({ active: { $ne: false } });
  next();
});

// instance methods

userSchema.methods.correctPassword = async function (password, passwordHash) {
  // this.password NE RADI JER SMO STAVILI ZA PWD select: false
  return await bcrypt.compare(password, passwordHash);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    // console.log(changedTimestamp, JWTTimestamp);
    // password promijenili prije nego sto je jwt issuean? true: pwd je promijenjena, nemamo pristup ruti; false, sve ok
    return changedTimestamp > JWTTimestamp;
  }
  // False - not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 5 * 60 * 1000;

  // console.log({ resetToken }, this.passwordResetToken);

  // na email saljemo unencrypted reset token, i njegov hash cemo provjeriti sa hasiranim tokenom u bazi
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: false, select: false },
  recoveryEmail: { type: String, required: true, trim: true, lowercase: true },
  whatsappNumber: { type: String, required: true, trim: true },
  authProvider: {
   type: String,
   enum: ['local', 'google'],
   default: 'local',
   required: true
  },
  firebaseUid: { type: String, default: null },
  emailVerified: { type: Boolean, default: false },
  recoveryEmailVerified: { type: Boolean, default: false },
  dateOfBirth: { type: Date, default: null },
  nationality: { type: String, default: null },
  countryOfResidence: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.email) {
   this.email = this.email.trim().toLowerCase();
  }

  if (this.recoveryEmail) {
   this.recoveryEmail = this.recoveryEmail.trim().toLowerCase();
  }

  if (this.whatsappNumber) {
   this.whatsappNumber = this.whatsappNumber.trim();
  }

  if (!this.isModified('password') || !this.password) return next();

  try {
   const isHashed = /^\$2[aby]\$/i.test(this.password);
   if (!isHashed) {
     const salt = await bcrypt.genSalt(10);
     this.password = await bcrypt.hash(this.password, salt);
   }
   next();
  } catch (error) {
   next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) return false;

  const isHashed = /^\$2[aby]\$/i.test(this.password);
  if (isHashed) {
   return await bcrypt.compare(candidatePassword, this.password);
  }

  if (candidatePassword === this.password) {
   if (this.isNew) return true;

   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(candidatePassword, salt);
   await this.save({ validateBeforeSave: false });
   return true;
  }

  return false;
};

module.exports = mongoose.model('User', userSchema);

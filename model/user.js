const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please provide a name'],
		trim: true,
	},
	email: {
		type: String,
		required: [true, 'Please provide an email'],
		trim: true,
		unique: true,
		lowercase: true,
		validate: {
			validator: function (value) {
				return validator.isEmail(value);
			},
			message: 'This is not a valid email',
		},
	},
	password: {
		type: String,
		required: [true, 'Please choose a password'],
		trim: true,
		minlength: [8, 'A password needs to contain at least 8 characters'],
		maxlength: [50, 'A password cannot exceed 50 characters'],
		validate: {
			validator: function (value) {
				return /([a-zA-Z])\d+/g.test(value);
			},
			message:
				'Your password need to contain lowercase, uppercase, numbers and a least one special character',
		},
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		trim: true,
		minlength: [8, 'A password needs to contain at least 8 characters'],
		maxlength: [50, 'A password cannot exceed 50 characters'],
		validate: {
			validator: function (value) {
				return value === this.password;
			},
			message: "Your passwords don't match",
		},
	},
	photo: String,
	role: {
		type: String,
		enum: ['user', 'guide', 'admin'],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	changedAt: Date,
	passwordResetToken: String,
	passwordResetExpiry: Date,
	newPassword: String,
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});

userSchema.pre(/^find/, function (next) {
	// this points to the current query
	this.find({ active: true });

	next();
});

userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	// ads a delay to ensure that the new token is created after the password has been changed
	// otherwise a user would not be able to use the new token
	this.changedAt = Date.now() - 1000;
	next();
});

userSchema.pre('save', async function (next) {
	// If the password has been modified
	if (!this.isModified('password')) return next();

	this.password = await bcrypt.hash(this.password, 12);

	// Set variable to undefined prevents it form being saved in the db
	this.passwordConfirm = undefined;

	next();
});

// Instance method - this refers to the current document
userSchema.methods.comparePassword = async function (userPassword) {
	return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.validatePasswordTimeStamp = function (timestamp) {
	if (this.changedAt) {
		const createdTimestamp = parseInt(this.changedAt.getTime() / 1000, 10);

		return createdTimestamp > timestamp;
	}

	// The password hasn't changed
	return false;
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	this.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10min

	return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

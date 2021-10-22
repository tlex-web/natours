const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../model/user');
const catchAsync = require('../utils/catchAsync');
const APIError = require('../utils/error');
const sendEmail = require('../utils/email');

const generateToken = id =>
	new Promise((resolve, reject) => {
		jwt.sign(
			{ id },
			process.env.SECRET,
			{
				expiresIn: process.env.EXPIRY,
			},
			// JWT callback function which contains possible errors and the token
			(err, token) => {
				if (err) reject(err);
				else resolve(token);
			}
		);
	});

const createAndSendJWT = catchAsync(async (user, statusCode, res) => {
	const token = await generateToken(user._id);

	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') options.secure = true;

	res.cookie('jwt', token, options);

	// Remove the password from the output
	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user: user,
		},
	});
});

exports.signup = catchAsync(async (req, res, next) => {
	const user = await User.create(req.body);

	createAndSendJWT(user, 201, res)
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password)
		return next(
			new APIError('Please provide your email and password', 400)
		);

	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.comparePassword(password)))
		return next(new APIError('Incorrect email or password', 401));

	const token = await generateToken(user._id);

	res.status(200).json({
		status: 'success',
		token,
	});
});

exports.protect = catchAsync(async (req, res, next) => {
	let token;

	// 1) Receive Token
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token)
		return next(
			new APIError('You need to login to request this resource', 401)
		);

	// 2) Validate Token
	const decoded = await promisify(jwt.verify)(token, process.env.SECRET);

	// 3) Check if user exists
	const user = await User.findById(decoded.id);

	if (!user) return next(new APIError('The user no longer exists', 401));

	// 4) Check if the user changed pw after the token was provided
	if (user.validatePasswordTimeStamp(decoded.iat))
		return next(new APIError('Password changed - Please log in', 401));

	// 5) Grant access
	req.user = user;

	next();
});

exports.restrictTo =
	(...roles) =>
	(req, res, next) => {
		// current default role: user
		// the req.user information's are coming from the login middleware,
		// which runs before the roles middleware and set the user properties to req.user
		if (!roles.includes(req.user.role)) {
			return next(new APIError('You do not have permissions here', 403));
		}

		next();
	};

exports.forgotPassword = catchAsync(async (req, res, next) => {
	// 1) Get user by email
	const user = await User.findOne({ email: req.body.email });

	if (!user)
		return next(new APIError('There is no user with that email', 404));

	// Generate the reset token
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	// Send the reset token via email
	const url = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/users/reset/${resetToken}`;

	const message = `Password Forgot -> Patch request here: ${url}`;

	try {
		await sendEmail({
			email: user.email,
			subject: 'PW RESET',
			text: message,
		});

		res.status(200).json({
			status: 'success',
			message: 'Token send',
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpiry = undefined;

		// set validateBeforeSave to false to prevent the check of mandatory fields of the user model
		await user.save({ validateBeforeSave: false });

		return next(new APIError('There was an error sending the email', 500));
	}
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	// 1) Get user by token
	const hash = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex');

	// find the token and check if the token has expired
	const user = await User.findOne({
		passwordResetToken: hash,
		passwordResetExpiry: { $gt: Date.now() },
	});

	if (!user)
		return next(new APIError('The token is invalid or has expired', 400));

	// 2) Set password if token hasn't expired
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpiry = undefined;

	await user.save();

	// 3) Update changeAt

	// 4) login
	const token = await generateToken(user._id);

	res.status(200).json({
		status: 'success',
		token,
	});
});

exports.updatePassword = catchAsync(async (req, res, next) => {
	// 1) Get user
	const { password, passwordConfirm, newPassword } = req.body;

	if (!password || !newPassword)
		return next(
			new APIError(
				'Please provide your email, password and your new password',
				400
			)
		);

	// req.user is set inside the protected route after validating the JWT token
	const user = await User.findById(req.user.id).select('+password');

	// 2) Validate password
	if (!user || !(await user.comparePassword(password)))
		return next(new APIError('Incorrect email or password', 401));

	// 3) Update password
	user.password = newPassword;
	user.passwordConfirm = passwordConfirm;
	user.newPassword = undefined;

	await user.save();

	// 4) login
	const token = await generateToken(user._id);

	res.status(200).json({
		status: 'success',
		token,
	});
});

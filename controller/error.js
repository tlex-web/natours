const APIError = require('../utils/error');

const handleCastError = err => {
	const message = `Invalid ${err.path}: ${err.path}`;
	return new APIError(message, 400);
};

const handleDuplicateKeyError = err => {
	// search in keyValue to get the field
	const value = err.keyValue[Object.keys(err.keyValue)[0]];
	const message = `Duplicate field value: "${value}". Please use an other value.`;
	return new APIError(message, 400);
};

const handleValidationError = err => {
	const errors = Object.values(err.errors).map(el => el.message);
	const message = `Invalid input data. ${errors.join('. ')}`;
	return new APIError(message, 400);
};

const handleJWTError = () => new APIError('Invalid Token - Please log in', 401);

const handleJWTExpiredError = () =>
	new APIError('Token Expired - Please log in', 401);

const devError = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const prodError = (err, res) => {
	// operational, trusted error
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	}
	// programming error - don't leak information about it
	else {
		// log the error
		// eslint-disable-next-line no-console
		console.error('Error - ', err);

		res.status(500).json({
			status: 'error',
			message: 'Something went wrong on our side',
		});
	}
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		devError(err, res);
	} else if (process.env.NODE_ENV === 'production') {
		// Mongoose bad ObjectID
		if (err.name === 'CastError') err = handleCastError(err);
		// Mongoose duplicate key error
		if (err.code === 11000) err = handleDuplicateKeyError(err);
		// Mongoose validation error
		if (err.name === 'ValidationError') err = handleValidationError(err);
		// JWT Error
		if (err.name === 'JsonWebTokenError') err = handleJWTError();
		// JWT Expiry Error
		if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
		prodError(err, res);
	}
};

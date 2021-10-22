const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const APIError = require('./utils/error');
const error = require('./controller/error');

const tourRouter = require('./routes/tours');
const userRouter = require('./routes/users');
const reviewRouter = require('./routes/reviews')

const app = express();

// 1) GLOBAL MIDDLEWARE

// Set secure http headers
app.use(helmet())

// Logging
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));

}

// Limit requests from the same IP Address
const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many request from this computer, please try again later',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
app.use(
	hpp({
		whitelist: [
			'duration',
			'ratings',
			'ratingAverage',
			'difficulty',
			'price',
			'maxGroupSize',
			'ratingQuantity',
		],
	})
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)

// 3) UNHANDLED ROUTES
app.all('*', (req, res, next) => {
	next(new APIError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// 4) ERROR HANDLING
app.use(error);

module.exports = app;

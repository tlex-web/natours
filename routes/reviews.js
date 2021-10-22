const express = require('express');

const authentication = require('../controller/authentication');
const review = require('../controller/reviews');

const router = express.Router();

router
	.route('/')
	.get(review.getAllReviews)
	.post(
		authentication.protect,
		authentication.restrictTo('user'),
		review.createReview
	);

module.exports = router;

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [true, 'You must provide a review'],
		},
		rating: {
			type: Number,
			min: [1, 'A rating must be greater equal 1'],
			max: [5, 'A rating cannot be greater than 5'],
		},
		createdAt: {
			type: Date,
			default: Date.now(),
			select: false,
		},
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tours',
			required: [true, 'A review must belong to a tour'],
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'Users',
			required: [true, 'A review must belong to a user'],
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

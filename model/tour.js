const mongoose = require('mongoose');
// const User = require("./user");

const tourSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'A tour must be provided'],
			unique: true,
			trim: true,
			maxlength: [50, 'A tour name cannot be longer than 50 characters'],
			minlength: [5, 'A tour name needs at least 5 characters'],
			validate: {
				validator: function (value) {
					return /([a-zA-Z])\D+/g.test(value);
				},
				message: 'A tour can only contain characters',
			},
		},
		slug: String,
		duration: {
			type: Number,
			required: [true, 'A tour must have a duration'],
		},
		maxGroupSize: {
			type: Number,
			required: [true, 'A tour must have a group size'],
		},
		difficulty: {
			type: String,
			required: [true, 'A tour must have a difficulty'],
			enum: {
				values: ['easy', 'medium', 'difficult'],
				message: 'Difficulty is either: easy, medium, difficult',
			},
		},
		ratingsAverage: {
			type: Number,
			min: [1, 'A rating must be greater equal 1'],
			max: [5, 'A rating cannot be greater than 5'],
		},
		ratingQuantity: {
			type: Number,
		},
		price: {
			type: Number,
			required: [true, 'A tour must have a price'],
		},
		discount: {
			type: Number,
			validate: {
				validator: function (value) {
					// this only points on newly created documents, but not on updated documents
					return value < this.price;
				},
				message:
					'Discount price of ({VALUE}) is greater than the original price',
			},
		},
		summary: {
			type: String,
			required: [true, 'A tour must have a summary'],
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		imageCover: {
			type: String,
			required: [true, 'A tour must have a cover image'],
		},
		images: {
			type: [String],
		},
		createdAt: {
			type: Date,
			default: Date.now(),
			select: false,
		},
		startDates: [Date],
		secretTour: {
			type: Boolean,
			default: false,
		},
		startLocation: {
			// GEOJSON
			type: {
				type: String,
				default: 'Point',
				enum: ['Point']
			},
			coordinates: [Number],
			address: String,
			description: String,
		},
		// Embedding new documents into an existing document by passing them into an array
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: ['Point'],
				},
				coordinates: [Number],
				address: String,
				description: String,
				day: Number,
			},
		],
		// guides: Array,
		// Parent-referencing
		guides: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

tourSchema.virtual('durationInWeeks').get(function () {
	return Math.round(this.duration / 7);
});

// Document Middleware runs before the save and create event to manipulate douments that currently being saved
tourSchema.pre('save', function (next) {
	this.slug = this.name.split(' ').join('-').toLowerCase();
	next();
});

// Middleware to embed the user document into the guide array
//tourSchema.pre('save', async function(next) {
//	const guides = this.guides.map(async id => await User.findById(id))
//	this.guides = await Promise.all(guides)

//	next()
//})

// tourSchema.pre('save', function(next) {
// 	next()
// })

// tourSchema.post('save', function(document, next) {
// 	next()
// })

// Query Middleware
// THIS points on the current query -> protection
// Regex for all find methods like find, findOne, findById
tourSchema.pre(/^find/, function (next) {
	this.find({ secretTour: { $ne: true } });
	next();
});

tourSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'guides',
		select: '-__v -changedAt',
	});
	next();
});

tourSchema.post(/^find/, function (documents, next) {
	next();
});

// Aggregation Middleware
// THIS points to the current document
tourSchema.pre('aggregate', function (next) {
	this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
	next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

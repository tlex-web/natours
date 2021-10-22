const API = require('../utils/api');
const Tour = require('../model/tour');
const catchAsync = require('../utils/catchAsync');
const APIError = require('../utils/error');

exports.aliasTopTours = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

	next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
	const getTours = new API(Tour.find(), req.query)
		.filter()
		.sort()
		.limit()
		.pagination();

	const tours = await getTours.query;

	res.status(200).json({
		status: 'success',
		requestedAt: req.requestTime,
		results: tours.length,
		data: {
			tours,
		},
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findById(req.params.id).populate({
		path: 'guides',
		select: '-__v -changedAt',
	});

	if (!tour) {
		return next(new APIError('No tour found with that id', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			tour,
		},
	});
});

exports.createTour = catchAsync(async (req, res, next) => {
	const newTour = await Tour.create(req.body);

	res.status(201).json({
		status: 'success',
		data: newTour,
	});
});

exports.updateTour = catchAsync(async (req, res, next) => {
	const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	if (!updatedTour) {
		return next(new APIError('No tour found with that id', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			tour: updatedTour,
		},
	});
});

exports.deleteTour = catchAsync(async (req, res, next) => {
	const deletedTour = await Tour.findByIdAndDelete(req.params.id);

	if (!deletedTour) {
		return next(new APIError('No tour found with that id', 404));
	}

	res.status(204).json({
		status: 'success',
		data: deletedTour,
	});
});

exports.getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte: 4.5 } },
		},
		{
			$group: {
				_id: '$difficulty',
				numTours: { $sum: 1 }, // add one for each tour
				avgRating: { $avg: '$ratingsAverage' },
				numRatings: { $sum: '$ratingsQuantity' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' },
			},
		},
	]);

	res.status(200).json({
		status: 'success',
		data: {
			stats,
		},
	});
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = req.params.year * 1;

	const plan = await Tour.aggregate([
		{
			// unwind the startDates array
			$unwind: '$startDates',
		},
		{
			// select all dates in between the provided year
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`),
				},
			},
		},
		{
			// return the month, the number of tours and the names of the tours
			$group: {
				_id: { $month: '$startDates' },
				numOfTours: { $sum: 1 },
				tours: { $push: '$name' },
			},
		},
		{
			// adds a field and set to value the the value of the _id field
			$addFields: { month: '$_id' },
		},
		{
			$project: {
				// hide the _id field
				_id: 0,
			},
		},
		{
			// sort the number of tours descending
			$sort: { numOfTours: -1 },
		},
		{
			$limit: 6,
		},
	]);

	res.status(200).json({
		status: 'success',
		data: {
			plan,
		},
	});
});

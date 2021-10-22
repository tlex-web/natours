const User = require('../model/user');
const catchAsync = require('../utils/catchAsync');
const APIError = require('../utils/error');

const filterObject = (obj, ...fields) => {
	const validObj = {};
	Object.keys(obj).forEach(key => {
		if (fields.includes(key)) validObj[key] = obj[key];
	});
	return validObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
	const users = await User.find();

	res.status(200).json({
		status: 'success',
		results: users.length,
		data: {
			users,
		},
	});
});

exports.getUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!',
	});
};

exports.createUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!',
	});
};

exports.updateUserSelf = catchAsync(async (req, res, next) => {
	// 1) Check if a password is provided
	if (req.body.password || req.body.passwordConfirm)
		return next(
			new APIError('This route is not for password updates', 400)
		);

	// 2) Set up a filter object to limit the valid fields
	const filter = filterObject(req.body, 'name', 'email');

	// 3) Update user document
	const user = await User.findByIdAndUpdate(req.user.id, filter, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	});
});

exports.deleteUserSelf = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

exports.updateUser = (req, res, next) => {
	// 1)
};

exports.deleteUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not yet defined!',
	});
};

// catchAsync returns an anonymous function and runs all the code inside the function
// If the async function gets rejected, it catches the error and puts it in the next function
module.exports = func => (req, res, next) => {
	func(req, res, next).catch(err => next(err));
};

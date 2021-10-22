class API {
	constructor(query, queryString) {
		this.query = query;
		this.queryString = queryString;
	}

	filter() {
		// Create a new object with the individual key value pairs
		// Exclude query params to separate database filtering and pagination/result sorting
		const queryObject = { ...this.queryString };
		const exclude = ['page', 'limit', 'sort', 'fields'];
		exclude.forEach(element => delete queryObject[element]);

		// 1) FILTERING

		// { difficulty: "easy", duration: { gte: 5 } }
		const queryString = JSON.stringify(queryObject).replace(
			/\b(gte|gt|lte|lt)\b/g,
			match => `$${match}`
		);
		// The regular expression adds a dollar sign in front of the MongoDB operator
		// { difficulty: "easy", duration: { $gte: 5 } }

		this.query = this.query.find(JSON.parse(queryString));

		return this;
	}

	sort() {
		// 2) SORTING

		if (this.queryString.sort) {
			// Sort by multiple parameters
			// | sorting parameter   | ascending order
			// -----------------------------------------
			// | - sorting parameter | descending order
			const sortBy = this.queryString.sort.split(',').join(' ');

			this.query = this.query.sort(sortBy);
		} else {
			this.query = this.query.sort('-createdAt');
		}

		return this;
	}

	limit() {
		// 3) FIELD LIMITING

		if (this.queryString.fields) {
			// Only search for selected fields
			// | limiting parameter   | add fields
			// ---------------------------------------
			// | - limiting parameter | exclude fields
			const fields = this.queryString.fields.split(',').join(' ');

			this.query = this.query.select(fields);
		} else {
			this.query = this.query.select('-__v');
		}

		return this;
	}

	pagination() {
		// 4) PAGINATION

		const page = this.queryString.page * 1 || 1;
		const limit = this.queryString.limit * 1 || 10;
		// page 1 = 1 - 10, page 2 = 11 - 20, ...
		// amount of skipped documents for page 1 = (1-1)*10 = 0 -> skip 0 documents
		// amount of skipped documents for page 2 = (2-1)*10 = 10 -> skip 10 documents
		const skip = (page - 1) * limit;

		this.query = this.query.skip(skip).limit(limit);

		// if (this.queryString.page) {
		// 	const numberOfDocuments = await Tour.countDocuments();

		// 	if (skip >= numberOfDocuments) {
		// 		throw new Error('Page not exits');
		// 	}
		// }

		return this;
	}
}

module.exports = API;

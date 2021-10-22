const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const app = require('./index');

const DB = process.env.DATABASE.replace('<password>', process.env.PASSWORD);

mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})
	.then(connection => {
		console.log('Database connected');
	});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
	console.log(`App running on port ${port}...`);
});

// Shutting down the server and exit the nodejs process after an unhandled exeption occurs
process.on('uncaughtException', err => {
	console.error(err);
	server.close(() => {
		process.exit(1);
	});
});

// Shutting down the server and exit the nodejs process after an unhandled rejection occurs
process.on('unhandledRejection', err => {
	console.error(err.name, err.message);
	server.close(() => {
		process.exit(1);
	});
});

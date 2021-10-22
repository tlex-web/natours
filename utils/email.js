const nodemailer = require('nodemailer');

const sendEmail = async args => {
	// 1) Create a transporter
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PW,
		},
	});

	// 2) Define the email properties
	const options = {
		from: 'TLEX Webshop GmbH <test@gmail.com>',
		to: args.email,
		subject: args.subject,
		text: args.text,
	};

	// 3) Send the email
	await transporter.sendMail(options);
};

module.exports = sendEmail;

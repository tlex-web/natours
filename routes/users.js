const express = require('express');

const authentication = require('../controller/authentication');
const user = require('../controller/user');

const router = express.Router();

// AUTHENTICATION ROUTES
router.post('/signup', authentication.signup);
router.post('/login', authentication.login);

router.post('/forgot', authentication.forgotPassword);
router.patch('/reset/:token', authentication.resetPassword);

router.patch('/updateUser', authentication.protect, user.updateUserSelf);

router.patch('/update', authentication.protect, authentication.updatePassword);

router.delete('/deleteUser', authentication.protect, user.deleteUserSelf);

router.route('/').get(user.getAllUsers).post(user.createUser);

router
	.route('/:id')
	.get(user.getUser)
	.patch(user.updateUser)
	.delete(user.deleteUser);

module.exports = router;

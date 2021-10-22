const express = require('express');
const authentication = require('../controller/authentication');
const tourController = require('../controller/tour');

const router = express.Router();

router
	.route('/top-tours')
	.get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
	.route('/')
	.get(tourController.getAllTours)
	.post(tourController.createTour);

router
	.route('/:id')
	.get(tourController.getTour)
	.patch(tourController.updateTour)
	.delete(
		authentication.protect,
		authentication.restrictTo('admin', 'guide'),
		tourController.deleteTour
	);

module.exports = router;

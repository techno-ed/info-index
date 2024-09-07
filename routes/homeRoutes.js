const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { isLoggedIn } = require('../middlewares/auth');

router.get('/', isLoggedIn, homeController.getHomePage);

module.exports = router;

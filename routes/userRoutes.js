const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', userController.getLoginPage);
router.get('/register', userController.getRegisterPage);
router.post('/api/users/register', userController.register);
router.post('/api/users/login', userController.login);
router.get('/logout', userController.logout);
router.get('/api/user/points', userController.getUserPoints);
router.get('/profile', userController.getProfile);

module.exports = router;

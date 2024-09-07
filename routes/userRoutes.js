const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', userController.getLoginPage);
router.get('/register', userController.getRegisterPage);
router.post('/api/users/register', userController.register);
router.post('/api/users/login', userController.login);
router.get('/logout', userController.logout);

module.exports = router;

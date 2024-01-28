const express = require('express');
const {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUsers,
} = require('../controllers/userController');

const {
  singup,
  login,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', singup);

router.post('/login', login);

router.post('/forgotPassword', forgotPassword);

router.patch('/resetPassword/:token', resetPassword);

router.route('/').post(createUser).get(getUsers);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

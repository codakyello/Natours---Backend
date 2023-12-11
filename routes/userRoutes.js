const express = require('express');
const {
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { singup } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', singup);

router.route('/').post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

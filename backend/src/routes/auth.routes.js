
const express = require("express");

const router = express.Router();

const {
  register,
  login,
} = require("../controllers/auth.controller");

const {
  validateRegister,
  validateLogin,
} = require("../validators/auth.validator");

// Register new user
router.post("/register", validateRegister, register);

// Login existing user
router.post("/login", validateLogin, login);

module.exports = router;

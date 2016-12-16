'use strict';

let express = require('express');
let router = express.Router();

router.get('/register', (req, res, next) => {
  res.render('login');
  next();
});

router.post('/register', (req, res, next) => {
  next();
});

router.get('/login', (req, res, next) => {
  res.render('index');
  next();
});

router.post('/login', (req, res, next) => {
  res.render('index');
  next();
});

module.exports = router;

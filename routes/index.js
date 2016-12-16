'use strict';

var express = require('express');
var router = express.Router();

const docusign = require('../docusign');

var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({ storage: storage });

var Inquiry = require('../controllers/inquiry');
var InquiryController = new Inquiry();

var Question = require('../controllers/question');
var QuestionController = new Question();

let checkout = require('../controllers/checkout');
let CheckoutController = new checkout();

router.get('/', (req, res, next) => {
  res.render('index');
  next();
});

router.get('/esc', (req, res, next) => {
  res.render('esc');
  next();
});

router.get('/tw', (req, res, next) => {
  res.render('tw');
  next();
});

router.route('/questions')
.get((req, res, next) => {
  QuestionController.read(req, res, next);
})
.post((req, res, next) => {
  QuestionController.create(req, res, next);
});

router.route('/enroll')
.get((req, res, next) => {
  InquiryController.read(req, res, next);
})
.post(upload.single('espContract'), (req, res, next) => {
  InquiryController.create(req, res, next);
});

router.route('/enroll/terms')
.get((req, res, next) => {
  InquiryController.update(req, res, next);
})
.post((req, res, next) => {
  CheckoutController.create(req, res, next);
});

router.route('/enroll/checkout')
.get((req, res, next) => {
  CheckoutController.read(req, res, next);
})
.post((req, res, next) => {
  CheckoutController.update(req, res, next);
});

router.route('/enroll/cancel')
.get((req, res, next) => {
  CheckoutController.delete(req, res, next);
});

router.route('/createtable')
.get((req, res, next) => {
  InquiryController.createTable(req, res, next);
});

router.get('/helpfullinks', (req, res, next) => {
  res.render('links');
  next();
});

module.exports = router;

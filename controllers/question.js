'use strict';

module.exports = class QuestionController {

  read(req, res, next) {
    res.render('questions', {
      errors: false
    });
    next();
  }

  create(req, res, next) {
    res.render('questions', {
      errors: false,
    });
    next();
  }

}

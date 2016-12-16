'use strict';

let Inquiry = require('../models/inquiry');
let Terms = require('../models/terms');

module.exports = class InquiryController {

  createTable(req, res, next) {
    /*let newTerms = new Terms({
      name: 'old',
      1: 781,
      2: 998,
      3: null,
      4: null,
      5: null,
      6: null
    });
    newTerms.save();

    */
    Terms.find({}, function(err, terms) {
      console.log(JSON.stringify(terms));
      res.render('enroll', {errors: JSON.stringify(terms), make: false, model: false});
      next();
    });
  }

  create(req, res, next) {
    //Inquiry.remove({}, () => {}); // remove all previous submissions *testing*
    let newInquiry = new Inquiry({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      state: req.body.state,
      zipcode: req.body.zipcode,
      year: req.body.year,
      HDModelFamily: req.body.hdModelFamily,
      engineSize: req.body.engineSize,
      mileage: req.body.mileage,
      vin: req.body.vin,
    });

    let errors = newInquiry.validateSync();

    if(!errors) {
      newInquiry.save((err, newInquiry) => {
        if(err) {
          res.render('enroll', {
            errors: err,
            inquiries: false,
            make: false,
            model: false
          });
          next();
        } else {
          console.log('test1');
          newInquiry.checkContract(req)
          .then(() => {
            newInquiry.decodeVIN()
            .then(
              newInquiry.setCustomerParams,
              reason => Promise.reject(reason))
            .then(
              (message) => newInquiry.sendTerms(newInquiry._id, message),
              reason => Promise.reject(reason))
            .then(
              message => res.redirect('/enroll/terms?token=' + message),
              reason => Promise.reject(reason)
            ).catch((reason) => {
              res.render('enroll', {
                errors: reason,
                inquiries: false,
                make: false,
                model: false
              });
              next();
            });
          }, (reason) => Promise.reject(reason))
          .catch((reason) => {
            res.render('enroll', {
              errors: reason,
              inquiries: false,
              make: false,
              model: false
            });
            next();
          });
        }
      });
    } else {
      res.render('enroll', {
        errors: errors,
        inquiries: false,
        make: false,
        model: false
      });
      next();
    }

  }

  read(req, res, next) {
    Inquiry.find({}, function(err, inquiries) {
      res.render('enroll', {inquiries: inquiries, errors: false, make: false, model: false});
      next();
    });
  }

  update(req, res, next) {
    Inquiry.verifyToken(req.query.token)
    .then((data) => {
      if(data.data.failed === false) {
        Terms.find({name: data.data.type}, function(err, terms) {
          if(terms[0].name !== 'factory') {
            Inquiry.sendFailedEmail(data.data.id, data.data.type);
            res.render('terms', {
              one: false,
              two: false,
              three: false,
              four: false,
              five: false,
              six: false,
              token: false,
              data: false,
              errors: JSON.stringify('Can\'t do it, not under factory warranty. An email will be sent to [emailaddress] when your ' +
                                  'current ESP contract has been confirmed.')
            });
            next();
          } else {
            res.render('terms', {
              one: terms[0]['1'],
              two: terms[0]['2'],
              three: terms[0]['3'],
              four: terms[0]['4'],
              five: terms[0]['5'],
              six: terms[0]['6'],
              token: req.query.token,
              data: false,
              errors: false
            });
            next();
          }
        });
      } else {
        Inquiry.checkTermStatus(data.data.id)
        .then( (status) => {
          Terms.find({name: data.data.type}, function(err, terms) {
            res.render('terms', {
              one: terms[0]['1'],
              two: terms[0]['2'],
              three: terms[0]['3'],
              four: terms[0]['4'],
              five: terms[0]['5'],
              six: terms[0]['6'],
              token: req.query.token,
              data: false,
              errors: false
            });
            next();
          });
        }, (reason) => Promise.reject(reason))
        .catch( (reason) => {
          res.render('terms', {
            one: false,
            two: false,
            three: false,
            four: false,
            five: false,
            six: false,
            token: req.query.token,
            data: false,
            errors: reason
          });
          next();
        });
      }
    }, (err) => Promise.reject(err))
    .catch((reason) => {
      res.render('terms', {
        one: false,
        two: false,
        three: false,
        four: false,
        five: false,
        six: false,
        token: false,
        data: false,
        errors: reason
      });
      console.log(reason)
      next();
    });
  }

}

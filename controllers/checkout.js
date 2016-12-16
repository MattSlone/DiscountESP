'use strict';

let Inquiry = require('../models/inquiry');
let paypal = require('../paypal');
let PayPal = new paypal();
let docusign = require('../docusign');

module.exports = class CheckoutController {
  create(req, res, next) {
    Inquiry.verifyToken(req.body.token)
    .then((data) => {
      if(!req.body.extSvcContractTerm) {
        return Promise.reject('No term selected.');
      } else {
        return Inquiry.setCost(
          req.body.extSvcContractTerm,
          req.body.optTireWheelCov,
          data.data.id,
          data.data.type
        );
      }
    }, (reason) => Promise.reject(reason))
    .then((data) => PayPal.setExpressCheckout(
      data.cost,
      data.inquiry
    ), (reason) => Promise.reject(reason))
    .then((data) => {
      data.data.forEach((el, i) => {
        if(i === 0) {
          let param = el.split('=');
          if(param[0] === 'TOKEN') {
            Inquiry.findById(data.inquiry, (err, inquiry) => {
              if(err) {
                return Promise.reject(err);
              } else {
                inquiry.transactionID = decodeURI(param[1]);
                inquiry.transactionStatus = 'pending';
                inquiry.save((err, inquiry) => {
                  if(err) {
                    return Promise.reject(err);
                  } else {
                    res.redirect(
                      'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=' +
                      decodeURI(param[1])
                    );
                  }
                })

              }
            });
          } else {
            return Promise.reject('error');
          }
        }
      });
    }, reason => Promise.reject(reason))
    .catch((reason) => {
      res.render('terms', {
        one: false,
        two: false,
        three: false,
        four: false,
        five: false,
        six: false,
        token: false,
        errors: reason
      });
    });
  }

  read(req, res, next) {
    PayPal.getExpressCheckoutDetails(req.query.token)
    .then((data) => {
      Inquiry.findOne({transactionID: req.query.token}, (err, inquiry) => {
        if(err) {
          reject(err);
        } else {
          if(!data.join(',').match(/PAYERID=.+?(?=,)/g)) {
            return Promise.reject('Error processing payment.');
          } else {
            let payer = decodeURI(data.join(',').match(/PAYERID=.+?(?=,)/g)[0].split('=')[1]);
            let amount = decodeURI(data.join(',').match(/AMT=.+?(?=,)/g)[0].split('=')[1]);
            inquiry.payerID = payer;
            inquiry.save((err, inquiry) => {
              if(err) {
                reject(err);
              } else {
                let token = Inquiry.generateToken({
                  transactionID: decodeURI(inquiry.transactionID),
                  payerID: payer,
                  amount: amount
                });
                res.render('checkout', {
                  data: false,
                  errors: false,
                  cost: amount,
                  token: token,
                  extSvcContractTerm: inquiry.extSvcContractTerm,
                  optTireWheelCov: inquiry.optTireWheelCov
                });
                next();
              }
            });
          }
        }
      });
    }, (reason) => Promise.reject(reason))
    .catch((reason) => console.log(reason));
  }

  update(req, res, next) {
    PayPal.doExpressCheckout(req.body.token)
    .then((data) => {
      let status = data.data.join(',').match(/PAYMENTINFO_0_ACK=.+?(?=$)/g)[0].split('=')[1];
      Inquiry.findOne({transactionID: data.transactionID}, (err, inquiry) => {
        if(err) {
          return Promise.reject(err);
        } else {
          inquiry.transactionStatus = status.trim();
          inquiry.save((err, inquiry) => {
            let Docusign = new docusign(inquiry.name, inquiry.email);
            Docusign.initializeAPIClient()
            .then(
              apiClient => Docusign.createAuthHeader(apiClient),
              reason => Promise.reject(reason)
            )
            .then(
              apiClient => Docusign.assignClientToConfig(apiClient),
              reason => Promise.reject(reason)
            )
            .then(
              () => Docusign.makeRequest(),
              reason => Promise.reject(reason)
            )
            .then(
              () => {
                res.render('confirm', {
                  data: false,
                  token: false
                });
                next();
              },
              reason => Promise.reject(reason)
            )
            .catch(reason => {
              res.render('confirm', {
                data: reason,
                token: false
              });
              next();
            });
          });
        }
      });
    }, (reason) => Promise.reject(reason))
    .catch((reason) => {
      res.render('checkout', {
        data: false,
        errors: JSON.stringify(reason) + '\nPlease resubmit enrollment inquiry.',
        cost: false,
        token: false,
        extSvcContractTerm: false,
        optTireWheelCov: false
      });
      next();
    });
  }

}

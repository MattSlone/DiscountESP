'use strict';

let https = require('https');
let querystring = require('querystring');
let fs = require('fs');
let path = require('path');
let Inquiry = require('./models/inquiry');

module.exports = class PayPal {

  constructor() {
    this.options = {
      user: process.env.PAYPAL_USER,
      pwd: process.env.PAYPAL_PASS,
      sig: process.env.PAYPAL_SIG
    };
  }

  setExpressCheckout(cost, inquiry) {
    let postData = querystring.stringify({
      'USER': this.options.user,
      'PWD': this.options.pwd,
      'SIGNATURE': this.options.sig,
      'METHOD': 'SetExpressCheckout',
      'VERSION': '204',
      'PAYMENTREQUEST_0_PAYMENTACTION': 'SALE',
      'PAYMENTREQUEST_0_AMT': cost,
      'PAYMENTREQUEST_0_CURRENCYCODE': 'USD',
      'RETURNURL': 'https://boiling-chamber-11419.herokuapp.com/enroll/checkout',
      'CANCELURL': 'http://localhost:3000/cancel'
    });

    return new Promise((resolve, reject) => {
      this.post(postData)
      .then((data) => {
        resolve({
          data: data,
          inquiry: inquiry
        });
      }, (reason) => Promise.reject(reason));
    });

  }

  getExpressCheckoutDetails(token) {
    let postData = querystring.stringify({
      'USER': this.options.user,
      'PWD': this.options.pwd,
      'SIGNATURE': this.options.sig,
      'METHOD': 'GetExpressCheckoutDetails',
      'VERSION': '204',
      'TOKEN': token
    });

    return new Promise((resolve, reject) => {
      resolve(this.post(postData));
    });
  }

  doExpressCheckout(token) {
    return new Promise((resolve, reject) => {
      Inquiry.verifyToken(token)
      .then((data) => {
        let postData = querystring.stringify({
          'USER': this.options.user,
          'PWD': this.options.pwd,
          'SIGNATURE': this.options.sig,
          'METHOD': 'DoExpressCheckoutPayment',
          'VERSION': '204',
          'TOKEN': data.data.transactionID,
          'PAYERID': data.data.payerID,
          'PAYMENTREQUEST_0_PAYMENTACTION': 'SALE',
          'PAYMENTREQUEST_0_AMT': data.data.amount,
          'PAYMENTREQUEST_0_CURRENCYCODE': 'USD'
        });

        this.post(postData)
        .then((postData) => {
          resolve({
            data: postData,
            transactionID: data.data.transactionID
          });
        }, (reason) => Promise.reject(reason));
      }, (reason) => reject(reason));
    });
  }


  post(postData) {
    let options = {
      hostname: 'api-3t.sandbox.paypal.com',
      port: 443,
      path: '/nvp',
      method: 'POST',
      key: fs.readFileSync(path.resolve(__dirname, 'certs') + '/ca-key.pem'),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs') + '/ca-crt.pem'),
      passphrase: 'password',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      let req = https.request(options, (res) => {
        /*console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);*/
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          var data = chunk.split('&');
          resolve(data);
        });
        res.on('end', () => {
          //console.log('No more data in response.');
        });
      });

      req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
        reject(`${e.message}`);
      });

      // write data to request body
      req.write(postData);
      req.end();
    });

  }

};

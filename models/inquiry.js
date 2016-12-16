'use strict';

const mongoose = require("mongoose");
const mailer = require('../mailer');
const Mailer = new mailer();
const getJSON = require('../getJSON');
const jwt = require('jsonwebtoken');
const path = require('path');
const Terms = require('./terms');
const fs = require('fs');

let inquirySchema = mongoose.Schema({
  name: { type: String, required: [true, 'Name is required.'] },
  phone: { type: String, required: [true, 'Phone number is required'] },
  email: { type: String, required: [true, 'Email is required'] },
  address: { type: String, required: [true, 'Address is required'] },
  state: { type: String,
           required: [true, 'State is required'],
           enum: {
             values: [
               'AL','AK','AZ','AR',/*'CA',*/'CO','CT','DE',/*'FL',*/'GA','HI',
               'ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS',
               'MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',/*'OR',*/
               'PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
             ],
             message: "{VALUE} is not an eligible state."
           }
         },
  zipcode: { type: String, required: [true, 'Zipcode is required'] },
  year: { type: Number,
          required: [true, 'Vehicle year is required'],
          max: [new Date().getFullYear() + 1, 'Cannot exceed 2017'],
          min: [2000, 'Must exceed 2004']
        },
  HDModelFamily: { type: String,
                   required: [true, 'HD Model Family is required'],
                   enum: [
                     'CVO',
                     'Trike',
                     'Touring',
                     'Softail',
                     'Dyna',
                     'Sportster / Street'
                   ]
                 },
  engineSize: { type: String,
                required: [true, 'Engine Size is required'],
                enum: ['500cc',
                       '750cc',
                       '883cc',
                       '1200cc',
                       '96ci',
                       '103ci',
                       '110ci'
                      ]
              },
  mileage: { type: String, required: [true, 'Vehicle Mileage is required.'] },
  vin: { type: String, required: [true, 'Vehicle Identification Number is required'],
  minlength: 17, maxlength: 17 },
  termType: { type: String },
  termStatus: { type: String },
  espID: { type: String },
  espContract: { type: String },
  extSvcContractTerm: { type: String },
  optTireWheelCov: { type: String },
  transactionID: { type: String },
  payerID: { type: String },
  transactionCost: { type: String },
  transactionStatus: { type: String },
  createdAt: { type: Date, default: Date.now },
});

/* METHODS */
inquirySchema.methods.decodeVIN = function() {
  let options = {
    host: 'vpic.nhtsa.dot.gov',
    port: 443,
    path: '/api/vehicles/DecodeVin/' + this.vin +
          '?format=json&modelyear=' + this.year,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    getJSON(options, (statusCode, result) => {
      let results = {};
      result.Results.forEach((obj) => {
        if(obj.Variable == 'Error Code') {
          results[obj.Variable] = obj.ValueId;
        } else {
          results[obj.Variable] = obj.Value;
        }
      });

      if(results['Error Code'] != '0' && results['Error Code'] != '1') {
        console.log(results['Error Code']);
        reject('Invalid VIN. Please contact kathy@uspmg.com or try again.');
      } else {
        resolve({
          year: results['Model Year'],
          make: results.Make,
          model: results.Model,
          series: results.Series
        });
      }
    });
  });
};

inquirySchema.methods.setCustomerParams = function(data) {
  let defaults = {
    XL: false,
    FactoryWarranty: false,
    New: false
  };

  return new Promise((resolve, reject) => {
    let currentYear = new Date().getFullYear();

    if(currentYear - 12 > data.year) {
      reject('Too old, ineligible');
    } else {
      if(data.year > currentYear - 4) {
        defaults.New = true;

        if(data.year >= currentYear) {
          defaults.FactoryWarranty = true;
        }

        if(data.series.startsWith('XL')) {
          defaults.XL = true;
        }
      }

      resolve(defaults);
    }
  });
};

inquirySchema.statics.generateToken = function(data) {
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    data: data
  }, process.env.SECRET);
};

inquirySchema.statics.verifyToken = function(token, callback) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if(err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  })
};

inquirySchema.methods.sendTerms = function(id, data) {
  return new Promise((resolve, reject) => {
    let type = '';

    if(data.FactoryWarranty) {
      type = 'factory';
    }

    else if(data.New && data.XL) {
      type = 'newXL';
    }

    else if(data.new) {
      type = 'new';
    }

    else if(!data.new) {
      type = 'old';
    }

    Inquiry.findById(id, (err, inquiry) => {
      if(err) {
        reject(err);
      } else {
        inquiry.termType = type;
        if(type !== 'factory') {
          inquiry.termStatus = 'unconfirmed';
        } else {
          inquiry.termStatus = 'confirmed';
        }
        inquiry.save( (err, inquiry) => {
          if(err) {
            reject(err);
          } else {
            resolve(Inquiry.generateToken({
              type: type,
              status: inquiry.termStatus,
              id: inquiry.id,
              failed: false
            }));
          }
        });
      }
    });
  })
};

inquirySchema.statics.setCost = function(esc, tw, inquiry, terms) {
  return new Promise((resolve, reject) => {

    let twCost = 0;
    Terms.find({ name: terms }, (err, terms) => {
      if(err) {
        reject(err);
      } else {
        switch(tw) {
          case '1':
          case '2':
          case '3':
            twCost = 275;
            break;
          case '4':
          case '5':
          case '6':
            twCost = 325;
            break;
          default:
            twCost = 0;
        }
        let cost = terms[0][esc] + twCost;
        Inquiry.findById(inquiry, (err, inquiryDoc) => {
          if(err) {
            reject(err);
          } else {
            inquiryDoc.transactionCost = cost;
            inquiryDoc.extSvcContractTerm = esc;
            inquiryDoc.optTireWheelCov = tw;
            inquiryDoc.save();
            resolve({cost: cost, inquiry: inquiry});
          }
        });
      }
    });
  })
};

inquirySchema.methods.checkContract = function(req, id) {
  console.log('test2');
  return new Promise((resolve, reject) => {
    console.log('test3');
    let currentYear = new Date().getFullYear();
    if(req.body.year < currentYear) {
      if(req.file) {
        console.log('test4');
        console.log(req.file);
        fs.readFile(req.file.path, function (err, data) {
          if(err) {
            reject(err);
          } else {
            let re = /(?:\.([^.]+))?$/;
            let newPath = path.resolve('./', "uploads") + '/espContract' +
            id + '.' + re.exec(req.file.originalname)[1];
            console.log(newPath);
            fs.writeFile(newPath, data, function (err) {
              if(err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }
        });
      } else {
        reject('Must upload ESP contract.');
      }
    } else {
      resolve();
    }
  });
};

inquirySchema.statics.sendFailedEmail = function(inquiry, type) {
  let token = Inquiry.generateToken({
    type: type,
    status: 'unconfirmed',
    id: inquiry,
    faled: true
  });
  Inquiry.findById(inquiry, (err, inquiry) => {
    Mailer.sendMail(
      inquiry.email,
      'DiscountESP | Contract Confirmation',
      'notUnderFactory',
      token,
      'http://boiling-chamber-11419.herokuapp.com/enroll/terms?token='
    );
  });
};

inquirySchema.statics.checkTermStatus = function(inquiry) {
  return new Promise((resolve, reject) => {
    Inquiry.findById(inquiry, (err, inquiry) => {
      if(err) {
        reject(err);
      } else {
        if(inquiry.termStatus === 'confirmed') {
          resolve(inquiry.termStatus);
        } else {
          reject('Your contract has not been confirmed yet. Please check back later.');
        }
      }
    });
  });
}

let Inquiry = mongoose.model("Inquiry", inquirySchema);
module.exports = Inquiry;

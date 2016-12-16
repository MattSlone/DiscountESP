'use strict';

let validator = new FormValidator('enroll', [
  {
    name: 'name',
    rules: 'required'
  },
  {
    name: 'phone',
    rules: 'required'
  },
  {
    name: 'email',
    rules: 'required|valid_email'
  },
  {
    name: 'address',
    rules: 'required'
  },
  {
    name: 'state',
    rules: 'required|callback_check_state'
  },
  {
    name: 'zipcode',
    rules: 'required|numeric'
  },
  {
    name: 'year',
    rules: 'required|callback_check_year_warranty|greater_than[2004]'
  },
  {
    name: 'hdModelFamily',
    rules: 'required'
  },
  {
    name: 'engineSize',
    rules: 'required'
  },
  {
    name: 'mileage',
    rules: 'required'
  },
  {
    name: 'vin',
    rules: 'required'
  },
  {
    name: 'espContract',
    rules: 'required',
    depends: 'checkFactoryWarranty'
  }
], function(errors, event) {
    if (errors.length > 0) {
      let errorString = '';
      errors.forEach(function(error) {
        errorString += ' ' + JSON.stringify(error.message).replace(/['"]+/g, '');
      });
      document.querySelector('.validation').innerHTML = "ValidationError: " + errorString;
    }
});

validator.registerCallback('check_state', function(value) {
  switch(value) {
    case 'FL':
    case 'CA':
    case 'OR':
      return false;
      break;
    default:
      return true;
  }
})
.setMessage('check_state', 'FL, CA, and OR are not eligible states.');

let uploadContract = false;

validator.registerCallback('check_year_warranty', function(value) {
  let currentYear = new Date().getFullYear();
  console.log(value);
  console.log(currentYear);

  if(value && value < currentYear) {
    uploadContract = true;
  } else {
    uploadContract = false;
  }
  console.log(uploadContract);
  return true;

});

validator.registerConditional('checkFactoryWarranty', function(field) {
  console.log(uploadContract);
  return uploadContract;
});


let termsValidator = new FormValidator('terms', [
  {
    name: 'extSvcContractTerm',
    rules: 'required'
  },
  {
    name: 'optTireWheelCov',
    rules: 'required'
  }
], function(errors, event) {
  //event.preventDefault();
    if (errors.length > 0) {
      let errorString = '';
      errors.forEach(function(error) {
        errorString += ' ' + JSON.stringify(error.message).replace(/['"]+/g, '');
      });
      document.querySelector('.validation').innerHTML = "ValidationError: " + errorString;
    }
});

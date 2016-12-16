'use strict';

const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates').EmailTemplate;
const juice = require('juice');
const path = require('path');

module.exports = class Mailer {

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    this.templates = {
      notUnderFactory: this.transporter.templateSender(
        new EmailTemplate(path.resolve(__dirname, 'resources', 'emails', 'notfactory')), {
          juiceOptions: {
            //
          },
          from: process.env.EMAIL_USER,
          attachments: [
            {
              filename: 'semperfi.png',
              path: path.resolve(__dirname, 'resources', 'emails', 'img') + '/semperfi.png',
              cid: '073de059ab0b79721180e1f87440d4fe'
            },
            {
              filename: 'discountesp.png',
              path: path.resolve(__dirname, 'resources', 'emails', 'img') + '/despemailsig.png',
              cid: '9dfb2149efcced582072de2e51e0b688'
            }
          ]
      })
    };
  }

  sendMail(email, subject, template, token, url) {
    this.templates[template]({
      to: email,
      subject: subject
    }, {
      tokenURL: url + token,
    }, function(err, info){
      if(err) {
        console.log('Error: ' + err);
      } else {
        console.log('email sent');
      }
    });
  }

};

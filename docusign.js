'use strict';

const docusign = require('docusign-esign');
const async = require('async');
const dotenv = require('dotenv');

let options = {
  integratorKey: process.env.DOCUSIGN_KEY,
  email: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS,
  docusignEnv: 'demo',
  templateId: process.env.DOCUSIGN_TEMPLATE,
  templateRoleName: 'Test',
  debug: false,
  basePath: 'https://demo.docusign.net/restapi'
};

module.exports = class Docusign {

  constructor(fullName, email) {
    this.fullName = fullName;
    this.recipientEmail = email;
  }

  initializeAPIClient() {
    let apiClient = new docusign.ApiClient();
    return new Promise((resolve, reject) => {
      apiClient.setBasePath(options.basePath);
      resolve(apiClient);
    });
  }

  createAuthHeader(apiClient) {
    // create JSON formatted auth header
    const creds = "{\"Username\":\"" + options.email + "\",\"Password\":\"" + options.password + "\",\"IntegratorKey\":\"" + options.integratorKey + "\"}";
    return new Promise((resolve, reject) => {
      apiClient.addDefaultHeader("X-DocuSign-Authentication", creds);
      resolve(apiClient);
    });
  }

  assignClientToConfig(apiClient) {
    return new Promise((resolve, reject) => {
      docusign.Configuration.default.setDefaultApiClient(apiClient);
      resolve();
    });
  }

  makeRequest() {
    let self = this;
    return new Promise((resolve, reject) => {
      async.waterfall([
        function login (next) {
          // login call available off the AuthenticationApi
          var authApi = new docusign.AuthenticationApi();

          // login has some optional parameters we can set
          var loginOps = new authApi.LoginOptions();
          loginOps.setApiPassword("true");
          loginOps.setIncludeAccountIdGuid("true");
          authApi.login(loginOps, function (error, loginInfo, response) {
            if (error) {
              reject(error);
            }
            else if(loginInfo) {
              console.log(loginInfo);
              // list of user account(s)
              // note that a given user may be a member of multiple accounts
              var loginAccounts = loginInfo.getLoginAccounts();
              console.log("LoginInformation: " + JSON.stringify(loginAccounts));
              next(null, loginAccounts);
            }
          });
        },

        function sendTemplate (loginAccounts, next) {
          // create a new envelope object that we will manage the signature request through
          var envDef = new docusign.EnvelopeDefinition();
          envDef.setEmailSubject("Please sign this document sent from Node SDK)");
          envDef.setTemplateId(options.templateId);

          // create a template role with a valid templateId and roleName and assign signer info
          var tRole = new docusign.TemplateRole();
          tRole.setRoleName(options.templateRoleName);
          tRole.setName(self.fullName);
          tRole.setEmail(self.recipientEmail);

          // create a list of template roles and add our newly created role
          var templateRolesList = [];
          templateRolesList.push(tRole);

          // assign template role(s) to the envelope
          envDef.setTemplateRoles(templateRolesList);

          // send the envelope by setting |status| to "sent". To save as a draft set to "created"
          envDef.setStatus("sent");

          // use the |accountId| we retrieved through the Login API to create the Envelope
          var loginAccount = new docusign.LoginAccount();
          loginAccount = loginAccounts[0];
          var accountId = loginAccount.accountId;

          // instantiate a new EnvelopesApi object
          var envelopesApi = new docusign.EnvelopesApi();

          // call the createEnvelope() API
          envelopesApi.createEnvelope(accountId, envDef, null, function (error, envelopeSummary, response) {
            if (error) {
              reject(error);
            } else {
              console.log("EnvelopeSummary: " + JSON.stringify(envelopeSummary));
              next(null);
            }
          });
        }

      ], function end (error) {
        if (error) {
          console.log('Error: ', error);
          reject(error);
        }
        resolve();
      });
    });
  }
}

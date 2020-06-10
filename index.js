import fetch from 'node-fetch';
import * as _ from 'lodash';
import Amplify, { Auth, API } from 'aws-amplify';
import inquirer from 'inquirer';

global.fetch = fetch;

Amplify.configure({
  Auth: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_XXXX',
    userPoolWebClientId: 'XXXX',
    mandatorySignIn: true,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
  },
  API: {
    endpoints: [
      {
        name: 'api',
        endpoint: 'https://XXXX.execute-api.us-east-2.amazonaws.com/Prod',
        custom_header: async () => {
          console.log(`Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`);
          return { Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
        }
      }
    ]
  },
});

let user = null;

async function registerPrompt() {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Please enter email',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide an email';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'password',
        message: 'Please enter password',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide a password';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'name',
        message: 'Please enter name',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide a name';
          }
          return true;
        },
      },
    ]).then(async (answer) => {
      const { email, password, name } = answer;
      try {
        const user = await Auth.signUp({
          username: email,
          password,
          attributes: { name },
        });
        console.log({ user });
        return verifyPrompt();
      } catch (error) {
        console.log(`Err: ${error.message}`);
        return initPrompt();
      }
    });
}

async function loginPrompt() {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Please enter email',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide an email';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'password',
        message: 'Please enter password',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide a password';
          }
          return true;
        },
      }
    ]).then(async ({ password, email }) => {
      try {
        user = await Auth.signIn(email, password);
        console.log('Congratulation! You are now logged in.');
        console.dir(user);
        return initPrompt();
      } catch (error) {
        console.log(`Err: ${error.message}`);
        return initPrompt();
      }
    });
}

async function verifyPrompt() {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Please enter email',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide an email';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'code',
        message: 'Please enter verification code',
        validate(v) {
          if (_.isEmpty(v)) {
            return 'Please provide the code';
          }
          return true;
        },
      }
    ]).then(async ({ code, email }) => {
      try {
        await Auth.confirmSignUp(email, code);
        console.log('Congratulation! You completed the signup. You can now login.');
        return loginPrompt();
      } catch (error) {
        console.log(`Err: ${error.message}`);
        return initPrompt();
      }
    });
}

async function apiUsers() {
  return API.get('api', '/admin/user').then(response => {
    console.dir(response);
    return initPrompt();
  })
  .catch(error => {
    if (_.has(error, 'response.data')) {
      console.log(error.response.data);
    } if (_.has(error, 'message')) {
      console.log(`Err: ${error.message}`);
    } else {
      console.log(error);
    }
    return initPrompt();
  });
}

async function initPrompt() {
  return inquirer
    .prompt({
      type: 'list',
      name: 'flow',
      message: 'Please select what do you want to do?',
      choices: [
        {
          name: 'Sign Up',
          value: 'register',
        },
        {
          name: 'Sign In',
          value: 'login',
        },
        {
          name: 'Confirm Code',
          value: 'verify',
        },
        {
          name: 'Get List of Users',
          value: 'apiusers',
        }
      ],
    }).then(({ flow }) => {
      if (flow === 'register') return registerPrompt();
      if (flow === 'login') return loginPrompt();
      if (flow === 'verify') return verifyPrompt();
      if (flow === 'apiusers') return apiUsers();
    });
}

(async () => initPrompt())();

const dotenv = require("dotenv");

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_DIALECT,
  PROD_DB_HOSTNAME,
  PROD_DB_PORT,
  PROD_DB_NAME,
  PROD_DB_USERNAME,
  PROD_DB_PASSWORD,
  PROD_DB_DIALECT,
  SMS_API_TOKEN,
  SMS_API_URL,
  CALLBACK_URL,
  SMS_SENDER_ID,
  SMS_USER_ID,
  RABBITMQ_HOST,
  RABBITMQ_PORT,
  RABBITMQ_USER,
  RABBITMQ_PASSWORD,
  RABBITMQ_QUEUE_NAME,
  RABBITMQ_RETRY_QUEUE_NAME,
  PROD_RABBITMQ_HOST,
  PROD_RABBITMQ_PORT,
  PROD_RABBITMQ_USER,
  PROD_RABBITMQ_PASSWORD,
  PROD_RABBITMQ_QUEUE_NAME,
} = process.env;

const development = {
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  smstoken: SMS_API_TOKEN,
  smsurl: SMS_API_URL,
  callbackurl: CALLBACK_URL,
  smssenderID: SMS_SENDER_ID,
  smsuserid: SMS_USER_ID,
  rabbitmqhost: RABBITMQ_HOST,
  rabbitmqport: RABBITMQ_PORT,
  rabbitmquser: RABBITMQ_USER,
  rabbitmqpassword: RABBITMQ_PASSWORD,
  rabbitmqqueuename: RABBITMQ_QUEUE_NAME,
  rabbitmqretryqueuename: RABBITMQ_RETRY_QUEUE_NAME
};

const test = { ...development }; // you can customize differently if needed

const production = {
  username: PROD_DB_USERNAME,
  password: PROD_DB_PASSWORD,
  database: PROD_DB_NAME,
  host: PROD_DB_HOSTNAME,
  port: PROD_DB_PORT,
  dialect: PROD_DB_DIALECT,
  smstoken: SMS_API_TOKEN,
  smsurl: SMS_API_URL,
  callbackurl: CALLBACK_URL,
  smssenderID: SMS_SENDER_ID,
  smsuserid: SMS_USER_ID,
  rabbitmqhost: PROD_RABBITMQ_HOST,
  rabbitmqport: PROD_RABBITMQ_PORT,
  rabbitmquser: PROD_RABBITMQ_USER,
  rabbitmqpassword: PROD_RABBITMQ_PASSWORD,
  rabbitmqqueuename: PROD_RABBITMQ_QUEUE_NAME,
  rabbitmqretryqueuename: RABBITMQ_RETRY_QUEUE_NAME
};

module.exports = { development, test, production };

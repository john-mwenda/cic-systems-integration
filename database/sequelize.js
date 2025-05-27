// db.js or sequelize.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import * as config from '../config/config.cjs';
dotenv.config();

// Get environment variables
const { NODE_ENV } = process.env;
const Config = config[NODE_ENV];

const sequelizeInstance = new Sequelize(Config.database, Config.username, Config.password, {
  host: 'localhost',
  dialect: 'postgres', // or 'postgres', 'sqlite', etc.
  // other options
});

export default sequelizeInstance;
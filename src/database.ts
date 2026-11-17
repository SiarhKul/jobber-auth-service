import { winstonLogger } from '@SiarhKul/jobber-shared';
import { Sequelize } from 'sequelize';
import { Logger } from 'winston';
import {config} from './configuration';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

export const sequelize = new Sequelize({
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    multipleStatements: true
  }
});

export async function databaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    log.info('Auth service successfully connected to database.');
  } catch (error) {
    log.error('Auth service unable to connect to database.', error);
  }
}

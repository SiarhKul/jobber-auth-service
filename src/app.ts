import express, { Express } from 'express';
import { start } from './server';
import { databaseConnection } from './database';
import { config } from './configuration';

const initialize = () => {
  const app: Express = express();

  config.cloudinaryConfig();

  databaseConnection();
  start(app);
};

initialize();

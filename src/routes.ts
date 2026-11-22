import type { Application } from 'express';

export function appRoutes(app: Application): void {
  app.use((_req, _res, next) => {
    next();
  });
}

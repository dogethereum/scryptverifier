const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const config = require('../config');
const api = require('./routes');
const logger = require('./controllers/logger');
const notification = require('./controllers/notifications');
const verifier = require('./controllers/verifier');

function createApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors());

  app.use('/api/v1', api);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({ errors: [err.message] });
  });

  return app;
}

function startServer() {
  const port = parseInt(config.port || '3000', 10);
  const app = createApp();
  app.port = port;
  const server = http.createServer(app);
  notification.installNotifications(server);
  verifier.installEventListener();
  server.listen(port, () => {
    logger.info(`App started at ${port}`);
  });
}

startServer();

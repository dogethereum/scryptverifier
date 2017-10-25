const socket = require('socket.io');
const logger = require('./logger');

let connections = [];

function removeConnection(conn) {
  connections = connections.filter(c => c.id !== conn.id);
}

function unregisterNotifications(conn) {
  removeConnection(conn);
}

function registerNotifications(conn) {
  unregisterNotifications(conn);
  connections.push(conn);
}

function sendNotification(...data) {
  const toRemove = [];
  connections.forEach((conn) => {
    try {
      conn.emit(...data);
    } catch (ex) {
      toRemove.push(conn);
    }
  });
  toRemove.forEach(removeConnection);
}


function installNotifications(server) {
  const io = socket.listen(server);
  io.on('connection', (conn) => {
    logger.info(`New connection ${conn.id}`);
    conn.on('register', () => {
      logger.info(`Register ${conn.id}`);
      registerNotifications(conn);
    });
    conn.on('unregister', () => {
      logger.info(`Unregister ${conn.id}`);
      unregisterNotifications(conn);
    });
    conn.on('disconnect', () => {
      logger.info(`Disconnect ${conn.id}`);
      removeConnection(conn);
    });
  });
}

module.exports = {
  installNotifications,
  registerNotifications,
  sendNotification,
  unregisterNotifications,
};

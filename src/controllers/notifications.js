const socket = require('socket.io');

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

function installNotifications(server) {
  const io = socket.listen(server);
  io.on('connection', (conn) => {
    console.log(`New connection ${conn.id}`);
    conn.on('register', () => {
      console.log(`Register ${conn.id}`);
      registerNotifications(conn);
    });
    conn.on('unregister', () => {
      console.log(`Unregister ${conn.id}`);
      unregisterNotifications(conn);
    });
    conn.on('disconnect', () => {
      console.log(`Disconnect ${conn.id}`);
      removeConnection(conn);
    });
  });
}

module.exports = {
  installNotifications,
  registerNotifications,
  unregisterNotifications,
};

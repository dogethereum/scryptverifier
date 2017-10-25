import io from 'socket.io-client';
import config from '../config';

export function subscribeNotifications() {
  const socket = io(`${config.host}:${config.port}`);
  socket.on('connect', () => {
    socket.emit('register');
  });
  socket.on('disconnect', () => {
    socket.emit('unregister');
  });
  return socket;
}

export default {
  subscribeNotifications,
};

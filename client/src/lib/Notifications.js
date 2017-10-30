import { EventEmitter } from 'events';
import io from 'socket.io-client';
import config from '../config';

class NotificationController extends EventEmitter {
  subscribe() {
    this.socket = io(`${config.host}:${config.port}`);
    this.socket.on('connect', () => {
      this.socket.emit('register');
      this.socket.on('newSubmission', (hash) => {
        this.emit('newSubmission', hash);
      });
    });
    this.socket.on('disconnect', () => {
      this.socket.emit('unregister');
    });
  }

  unsubscribe() {
    if (this.socket) {
      this.socket.emit('unregister');
      this.socket.close();
      this.socket = null;
    }
  }
}

export default NotificationController;

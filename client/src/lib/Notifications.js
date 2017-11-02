import { EventEmitter } from 'events';
import io from 'socket.io-client';
import config from '../config';

class NotificationController extends EventEmitter {
  constructor() {
    super();
    this.reconnectEvents = this.reconnectEvents.bind(this);
    this.subscribed = false;
  }

  subscribe() {
    this.subscribed = true;
    this.socket = io(`${config.host}:${config.port}`);
    this.socket.on('connect', () => {
      this.socket.emit('register');
      this.socket.on('newSubmission', (hash, input) => {
        this.emit('newSubmission', hash, input);
      });
      this.socket.on('newChallenge', (hash, challengeId) => {
        this.emit('newChallenge', hash, challengeId);
      });
      this.socket.on('newDataHashes', (hash, challengeId) => {
        this.emit('newDataHashes', hash, challengeId);
      });
      this.socket.on('newRequest', (hash, challengeId, round) => {
        this.emit('newRequest', hash, challengeId, round);
      });
      this.socket.on('roundVerified', (hash, challengeId, round) => {
        this.emit('roundVerified', hash, challengeId, round);
      });
    });
    this.socket.on('disconnect', () => {
      this.socket.emit('unregister');
      this.socket.close();
      this.socket = null;
      if (this.subscribed) {
        setTimeout(this.reconnectEvents, 60 * 1000);
      }
    });
  }

  reconnectEvents() {
    if (!this.socket) {
      this.subscribe();
    }
  }

  unsubscribe() {
    if (this.socket) {
      this.subscribed = false;
      this.socket.emit('unregister');
      this.socket.close();
      this.socket = null;
    }
  }
}

export default NotificationController;

import fetch from 'unfetch';
import config from '../config';

const basePath = `${config.host}:${config.port}/api/v1`;

function makeUrl(path) {
  return `${basePath}/${path}`;
}

function fetchJson(path) {
  return fetch(makeUrl(path)).then(result => result.json());
}

export function getEvents() {
  return fetchJson('event');
}

export function getSubmission(hash) {
  return fetchJson(`submission/${hash}`);
}

export function getSubmissions() {
  return fetchJson('submission');
}

export default {
  getEvents,
  getSubmission,
  getSubmissions,
};

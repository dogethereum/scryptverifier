const ethereum = require('./ethereum');
const notification = require('./notifications');
const logger = require('./logger');

function registerEvent(event, callback) {
  event.watch((err, result) => {
    try {
      if (!err) {
        callback(result);
      } else {
        logger.error(`Error: ${err} - ${err.stack}`);
      }
    } catch (ex) {
      logger.error(`Error: ${ex} - ${ex.stack}`);
    }
  });
}

async function installEventListener() {
  const scryptVerifier = await ethereum.getScryptVerifier();
  registerEvent(scryptVerifier.NewSubmission(), (result) => {
    const { hash, input } = result.args;
    notification.sendNotification('newSubmission', hash, input);
  });
}

module.exports = {
  installEventListener,
};

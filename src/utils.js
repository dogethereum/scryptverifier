
function findLogs(receipt, logName) {
  const logs = receipt.logs.filter(lg => lg.event === logName);
  return logs.length > 0 ? logs[0] : {};
}

function parseLogArgs(receipt, logName) {
  const { args } = findLogs(receipt, logName);
  return args;
}

const parseNewChallenge = receipt => parseLogArgs(receipt, 'NewChallenge');
const parseNewDataHashes = receipt => parseLogArgs(receipt, 'NewDataHashes');
const parseNewRequest = receipt => parseLogArgs(receipt, 'NewRequest');
const parseNewDataArrived = receipt => parseLogArgs(receipt, 'NewDataArrived');
const parseRoundVerified = receipt => parseLogArgs(receipt, 'RoundVerified');

module.exports = {
  findLogs,
  parseLogArgs,
  parseNewChallenge,
  parseNewDataHashes,
  parseNewRequest,
  parseNewDataArrived,
  parseRoundVerified,
};

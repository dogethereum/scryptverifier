const fs = require('fs');

let config = {
  port: 3001,
  host: 'http://localhost',
  rpcpath: 'http://localhost:8545',
};

try {
  const localConfig = JSON.parse(fs.readFileSync('local_config.json'));
  config = Object.assign(config, localConfig);
} catch (ex) {
  // Ignore missing local_config.json
}

module.exports = config;

const process = require('process');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

function generateMnemonic() {
  const mnemonic = bip39.generateMnemonic();
  const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
  const path = "m/44'/60'/0'/0/0";
  const wallet = hdwallet.derivePath(path).getWallet();
  const address = `0x${wallet.getAddress().toString('hex')}`;
  console.log(`Mnemonic: ${mnemonic}`);
  console.log(`Address: ${address}`);
}

function verifyMnemonic(mnemonic) {
  const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
  const path = "m/44'/60'/0'/0/0";
  const wallet = hdwallet.derivePath(path).getWallet();
  const address = `0x${wallet.getAddress().toString('hex')}`;
  console.log(`Mnemonic: ${mnemonic}`);
  console.log(`Address: ${address}`);
}

function help() {
  console.log('Usage:\n\n\tnode manageAccount.js <command> [<options>]\n');
  console.log('Commands:\n');
  console.log(' - generate        Generate a new account outputs seed and address');
  console.log('                   Example: manageAccount.js generate\n');
  console.log(' - verify "seed"   Verify a seed');
  console.log('                   Example: manageAccount.js verify "basket car face milk"');
}

function main() {
  if (process.argv.length <= 2) {
    help();
    process.exit(0);
  }
  if (process.argv[2] === 'generate') {
    generateMnemonic();
  } else if (process.argv[2] === 'verify') {
    verifyMnemonic(process.argv[3]);
  }
}

main();

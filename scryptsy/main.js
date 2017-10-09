const scrypt = require('./lib/scrypt.js')

class ScryptOutput {
  constructor() {

  }
}

function b32dec(blockHeader) {
  const buff = Buffer.from(blockHeader, 'hex');
  const result = new Buffer(buff.length);
  for (let i=0; i<buff.length; i+=4) {
    result[i+0] = buff[i+3];
    result[i+1] = buff[i+2];
    result[i+2] = buff[i+1];
    result[i+3] = buff[i+0];
  }
  return result;
}

async function main() {
  try {
    const blockHeader = '00000001cef715f6b8c64f3b898f1ef6081ddbae507650523b9e3a53ccbbb910279f633067a8ca9f52efe146c4b3edd3925982add09b500d9b5c60738399d5f1066b2a754ebb17b81d018ea7d4592d01';
    const input = b32dec(blockHeader);
    console.log(`Block header: ${blockHeader}`);
    const result = scrypt(input, input, 1024, 1, 1, 32);
    console.log(`Result: ${result.toString('hex')}`);
  } catch (err) {
    console.log(`${err} - ${err.stack}`);
  }
}

main();

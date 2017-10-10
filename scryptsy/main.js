const scrypt = require('./lib/scrypt.js');
const sha3 = require('js-sha3').keccak256;
const fs = require('fs');
const argv = require('yargs')
  .demandCommand(1)
  .argv;

function b32dec(blockHeader) {
  return reverse4bytes(Buffer.from(blockHeader, 'hex'));
}

function reverse4bytes(buffer) {
  const result = new Buffer(buffer.length);
  for (let i=0; i<buffer.length; i+=4) {
    result[i+0] = buffer[i+3];
    result[i+1] = buffer[i+2];
    result[i+2] = buffer[i+1];
    result[i+3] = buffer[i+0];
  }
  return result;
}

function reverse(buffer) {
  const result = new Buffer(buffer.length);
  for (let i=0; i<buffer.length; ++i) {
    result[i] = buffer[buffer.length - i - 1];
  }
  return result;
}


class ScryptOutput {
  constructor(filename) {
    this.filename = filename;
    this.rounds = [];
  }

  callback(input, output, step, extra) {
    const round = { step };
    if (step === 0) {
      round.input = reverse4bytes(input).toString('hex');
      round.input_hash = sha3(Buffer.from(round.input, 'hex')).toString('hex');
      round.output = reverse4bytes(output).toString('hex');
      round.output_hash = sha3(Buffer.from(round.output, 'hex')).toString('hex');
    } else if (step === 2049) {
      round.input = reverse4bytes(input).toString('hex');
      round.input_hash = sha3(Buffer.from(round.input, 'hex')).toString('hex');
      round.output = reverse(output).toString('hex');
      round.output_hash = sha3(Buffer.from(round.output, 'hex')).toString('hex');
    } else {
      round.input = reverse4bytes(input).toString('hex');
      round.input_hash = sha3(Buffer.from(round.input, 'hex')).toString('hex');
      round.output = reverse4bytes(output).toString('hex');
      round.output_hash = sha3(Buffer.from(round.output, 'hex')).toString('hex');
      if (step > 1024) {
        round.input2 = reverse4bytes(extra.input2).toString('hex');
        round.input2_hash = sha3(Buffer.from(round.input2, 'hex')).toString('hex');;
        round.input2_index = extra.input2_index;
      }
    }

    // console.log(`${JSON.stringify(round, null, '  ')}`);
    if (this.filename) {
      this.rounds.push(round);
    } else {
       console.log(`${JSON.stringify(round, null, '  ')}`);
    }
  }

  saveToFile() {
    // console.log(`${JSON.stringify(this.rounds, null, '  ')}`);
    if (this.filename) {
      fs.writeFileSync(this.filename, JSON.stringify(this.rounds, null, '  '));
    }
  }
}


async function main() {
  try {
    const blockHeader = argv._[0]; // '00000001cef715f6b8c64f3b898f1ef6081ddbae507650523b9e3a53ccbbb910279f633067a8ca9f52efe146c4b3edd3925982add09b500d9b5c60738399d5f1066b2a754ebb17b81d018ea7d4592d01';
    const input = b32dec(blockHeader);
    // console.log(`Block header: ${blockHeader}`);
    const scryptOutput = new ScryptOutput(argv.output);
    const result = scrypt(input, input, 1024, 1, 1, 32, (...params) => scryptOutput.callback(...params));
    // console.log(`Result: ${result.toString('hex')}`);
    scryptOutput.saveToFile();
  } catch (err) {
    console.log(`${err} - ${err.stack}`);
  }
}

main();

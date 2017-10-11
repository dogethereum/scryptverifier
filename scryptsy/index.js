const scrypt = require('./lib/scrypt.js');
const sha3 = require('./sha3').keccak256;

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
  constructor() {
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

    this.rounds.push(round);
  }

  saveToFile() {
    // console.log(`${JSON.stringify(this.rounds, null, '  ')}`);
    if (this.filename) {
      fs.writeFileSync(this.filename, JSON.stringify(this.rounds, null, '  '));
    }
  }
}


function calcScrypt(input) {
  return new Promise((resolve, reject) => {
    const scryptOutput = new ScryptOutput();
    const output = scrypt(input, input, 1024, 1, 1, 32, (...params) => scryptOutput.callback(...params));
    resolve([ output, scryptOutput.rounds ]);
  });
}

module.exports = calcScrypt;

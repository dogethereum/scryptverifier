const scrypt = require('./lib/scrypt.js');
const sha3 = require('./sha3').keccak256;


function be2le(input) {
  const buffer = new Buffer(input);
  const result = new Buffer(buffer.length);
  for (let i=0; i<buffer.length; i+=4) {
    result.writeUInt32LE(buffer.readUInt32BE(i), i);
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
      round.input = be2le(input).toString('hex');
      round.input_hash = sha3(Buffer.from(round.input, 'hex')).toString('hex');
      round.output = be2le(output).toString('hex');
      round.output_hash = sha3(Buffer.from(round.output, 'hex')).toString('hex');
    } else if (step === 2049) {
      round.input = be2le(input).toString('hex');
      round.input_hash = sha3(Buffer.from(round.input, 'hex')).toString('hex');
      round.output = output.reverse().toString('hex');
      round.output_hash = sha3(Buffer.from(round.output, 'hex')).toString('hex');
    } else {
      round.input = be2le(input).toString('hex');
      round.input_hash = sha3(Buffer.from(round.input, 'hex')).toString('hex');
      round.output = be2le(output).toString('hex');
      round.output_hash = sha3(Buffer.from(round.output, 'hex')).toString('hex');
      if (step > 1024) {
        round.input2 = be2le(extra.input2).toString('hex');
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

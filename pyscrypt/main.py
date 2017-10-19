import argparse
import json
from binascii import hexlify, unhexlify
from pyscrypt import hash
from sha3 import keccak_256

parser = argparse.ArgumentParser(description='Generate scrypt output')
parser.add_argument('header', help='Block header in hexadecimal')
parser.add_argument('--output', metavar='filename.json', help='Output file with proccessed header')


def b32dec(data):
    return b''.join([data[i:i+4][::-1] for i in range(0, len(data), 4)])


def tobytes(data):
    out = []
    for i in data:
        out.append((i >> 0) & 0xff)
        out.append((i >> 8) & 0xff)
        out.append((i >> 16) & 0xff)
        out.append((i >> 24) & 0xff)
    return bytes(out)


def sha3(data):
    s = keccak_256()
    s.update(data)
    return s.digest()


class ScryptOutput:
    def __init__(self, filename):
        self.filename = filename
        self.rounds = []

    def __call__(self, input, output, step, extra={}):
        if step == 2049:
            output = b32dec(output)
        elif step == 0:
            input = b32dec(input)
        else:
            input = tobytes(input)
            output = tobytes(output)
        round = {
            "step": step,
            "input": hexlify(b32dec(input)).decode('ascii'),
            "input_hash": hexlify(sha3(b32dec(input))).decode('ascii'),
            "output": hexlify(b32dec(output)).decode('ascii'),
            "output_hash": hexlify(sha3(b32dec(output))).decode('ascii')
        }
        if 'input2' in extra:
            input2 = tobytes(extra['input2'])
            round['input2'] = hexlify(b32dec(input2)).decode('ascii')
            round['input2_hash'] = hexlify(sha3(b32dec(input2))).decode('ascii')
            round['input2_index'] = extra['input2_index']
        if self.filename:
            self.rounds.append(round)
        else:
            print("{}".format(json.dumps(round, indent=2)))

    def save(self):
        if self.filename:
            with open(self.filename, 'w') as f:
                json.dump(self.rounds, f, indent=2)


def main():
    args = parser.parse_args()
    header = unhexlify(args.header)
    scryptOutput = ScryptOutput(args.output or None)
    input = header
    output = hash(input, input, 1024, 1, 1, 32, scryptOutput)
    if args.output:
        print("Input: {}".format(hexlify(input)))
        print("Output: {}".format(hexlify(output)))
    input = b32dec(header)
    hash(input, input, 1024, 1, 1, 32, scryptOutput)
    scryptOutput.save()


if __name__ == '__main__':
    main()

#include <iostream>
#include <iomanip>
#include <memory>
#include <map>
#include <fstream>
#include <tuple>
#include "scrypt.h"
#include "keccak-tiny.h"

int hex_digit(int h) {
	if (h >= '0' && h <= '9') {
		return h - '0';
	} else if (h >= 'a' && h <= 'f') {
		return 10 + h - 'a';
	} else if (h >= 'A' && h <= 'F') {
		return 10 + h - 'A';
	}
	abort();
}

void print1byte(uint32_t b)
{
	std::cout << std::setfill('0') << std::setw(2) << std::hex << (b & 0xFF);
	//std::cout << std::hex << ((int)b & 0x0F);
}

void print4bytes(uint32_t B)
{
	//std::cout << std::setfill('0') << std::setw(8) << std::hex << B;

	print1byte((B >> 24) & 0xFF);
	print1byte((B >> 16) & 0xFF);
	print1byte((B >> 8) & 0xFF);
	print1byte((B) & 0xFF);
}

void print128bytes(const uint32_t B[32])
{
	for (int i=0; i<32; ++i) {
		print4bytes(B[i]);
	}
	std::cout << std::endl;
}

void print32bytes(const uint8_t B[32])
{
	for (int i=0; i<32; ++i) {
		print1byte(B[i]);
	}
	std::cout << std::endl;
}


struct StepData {
	uint32_t input[32];
	uint32_t output[32];
	uint8_t hi[32];
	uint8_t ho[32];
};

StepData make_data(const uint32_t B[32]) {
	StepData d;
	memcpy(d.input, B, sizeof(uint32_t[32]));
	return d;
}

class MyCollection {
public:
	typedef std::map<int32_t, StepData> StepType;

	int my_keccak_256(uint8_t* out, uint32_t outLen, const uint32_t* in, uint32_t inNum) {
		if (inNum > 32) {
			exit(-1);
		}
		uint8_t inB[32 * sizeof(uint32_t)];
		for (uint32_t i=0, j=0; i<inNum; ++i) {
			uint32_t B = in[i];
			inB[j++] = (B >> 24) & 0xFF;
			inB[j++] = (B >> 16) & 0xFF;
			inB[j++] = (B >> 8) & 0xFF;
			inB[j++] = (B) & 0xFF;
		}
		return keccak_256(out, outLen, inB, inNum * sizeof(uint32_t));
	}

	StepData& getStepData(int32_t round) {
		auto it = steps.find(round);
		if (it == steps.end()) {
			it = steps.insert_or_assign(steps.end(), round, StepData());
		}
		return it->second;
	}
		

	void Notify(const uint32_t B[32], const uint32_t C[32], int32_t round) {
		if (round >= 4096) {
			if (round <= 4096 + 2) {
				std::cout << "Input1: ";
				print128bytes(B);
				std::cout << "Input2: ";
				print128bytes(C);
			}
			return;
		}

		StepData& data = getStepData(round);

		if (B) {
			if (round == 0) {
				memcpy_s(data.input, sizeof(data.input), B, 80);
				my_keccak_256(data.hi, 32, B, 20);
			} else {
				memcpy_s(data.input, sizeof(data.input), B, 128);
				my_keccak_256(data.hi, 32, B, 32);
			}
		}
		if (C) {
			if (round == 2049) {
				memcpy_s(data.output, sizeof(data.output), C, 32);
				my_keccak_256(data.ho, 32, C, 8);
			} else {
				memcpy_s(data.output, sizeof(data.output), C, 128);
				my_keccak_256(data.ho, 32, C, 32);
			}
		}

		if (round < 3 && B) {
			auto it = steps.find(round);
			std::cout << "Hash: ";
			print32bytes(it->second.hi);
			std::cout << "Input: ";
			print128bytes(it->second.input);
		}
	}

	void write_space(std::ostream& os, int spaces) {
		for (int i=0; i<spaces; ++i) {
			os.write(" ", 1);
		}
	}

	void write_1byte(std::ostream& os, uint32_t b) {
		os << std::setfill('0') << std::setw(2) << std::hex << (b & 0xFF);
	}

	void write_4bytes(std::ostream& os, uint32_t b) {
		write_1byte(os, (b >> 24) & 0xFF);
		write_1byte(os, (b >> 16) & 0xFF);
		write_1byte(os, (b >> 8) & 0xFF);
		write_1byte(os, (b) & 0xFF);
	}

	void write_128bytes(std::ostream& os, const uint32_t in[32]) {
		for (int i=0; i<32; ++i) {
			write_4bytes(os, in[i]);
		}
	}

	void write_80bytes(std::ostream& os, const uint32_t in[32]) {
		for (int i=0; i<20; ++i) {
			write_4bytes(os, in[i]);
		}
	}

	void write_32bytes_bis(std::ostream& os, const uint32_t in[32]) {
		for (int i=0; i<8; ++i) {
			write_4bytes(os, in[i]);
		}
	}

	void write_32bytes(std::ostream& os, const uint8_t in[32]) {
		for (int i=0; i<32; ++i) {
			write_1byte(os, in[i]);
		}
	}

	void write_data(std::ostream& os, int32_t step, const StepData& data, int spaces) {
		write_space(os, spaces);
		os << "{" << std::endl;

		write_space(os, spaces + 2);
		os << "\"step\" : " << std::dec << step << std::endl;

		write_space(os, spaces + 2);
		os << "\"input\" : \"";
		if (step == 0) {
			write_80bytes(os, data.input);
		} else {
			write_128bytes(os, data.input);
		}
		os << "\"," << std::endl;

		write_space(os, spaces + 2);
		os << "\"input_hash\" : \"";
		write_32bytes(os, data.hi);
		os << "\"," << std::endl;

		write_space(os, spaces + 2);
		os << "\"output\" : \"";
		if (step == 2049) {
			write_32bytes_bis(os, data.output);
		} else {
			write_128bytes(os, data.output);
		}
		os << "\"," << std::endl;

		write_space(os, spaces + 2);
		os << "\"output_hash\" : \"";
		write_32bytes(os, data.ho);
		os << "\"" << std::endl;

		write_space(os, spaces);
		os << "}";
	}

	void Save(char* filename) {
		std::ofstream file(filename);

		auto it = steps.cbegin();
		bool first = true;
		file << "[" << std::endl;
		while (it != steps.cend()) {
			if (!first) {
				file << "," << std::endl;
			} else {
				first = false;
			}
			auto step = it->first;
			write_data(file, it->first, it->second, 2);
			++it;
		}
		if (!steps.empty()) {
			file << std::endl;
		}
		file << "]" << std::endl;
		file.close();
	}

private:
	StepType steps;
};

std::unique_ptr<MyCollection> g_my;

uint32_t myNotifyFunc(const uint32_t B[32], const uint32_t C[32], int32_t round)
{
	if (g_my) {
		g_my->Notify(B, C, round);
	}

	return 0;
}


int main() {
	char header[] = "01000000f615f7ce3b4fc6b8f61e8f89aedb1d0852507650533a9e3b10b9bbcc30639f279fcaa86746e1ef52d3edb3c4ad8259920d509bd073605c9bf1d59983752a6b06b817bb4ea78e011d012d59d4";
	//char header[] = "4241414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141";
	char input[80];
	char output[256];

	//uint8_t out[32];
	////uint8_t in[32] = { '\x41', '\x41', '\x41', '\x42' };
	////uint32_t in2[] = { 0x41414142 };
	////uint32_t in3[] = { 0x42414141 };
	////sha3_256(out, 32, in, 0);

	////shake256(out, 32, in, 0);

	////keccak_256(out, 32, in, 4);
	////keccak_256(out, 32, reinterpret_cast<const uint8_t*>(in2), 4);
	////keccak_256(out, 32, reinterpret_cast<const uint8_t*>(in3), 4);

	//char hh[] = "01e4aba4fd406bcb53e2ce3f58e44b22c0b320ac5aa9b30c7f5366de6b17ded3";
	//uint8_t in[32];
	//for (int i=0; i<32; i++) {
	//	int a = hex_digit(hh[2*i]);
	//	int b = hex_digit(hh[2*i + 1]);
	//	in[i] = a * 16 + b;
	//}
	////uint8_t out[32];
	//keccak_256(out, 32, in, 32);


	g_my = std::make_unique<MyCollection>();
	
	for (int i=0; i<80; i++) {
		int a = hex_digit(header[2*i]);
		int b = hex_digit(header[2*i + 1]);
		input[i] = a * 16 + b;
	}

	scrypt_1024_1_1_256(input, output, myNotifyFunc);

	// convert big endian
	for (int i=0; i<32; ++i) {
		std::cout << std::hex << (((int)output[31-i] & 0xF0) >> 4);
		std::cout << std::hex << ((int)output[31-i] & 0x0F);
	}
	std::cout << std::endl;

	//g_my->Save("D:\\nektra\\dogethereum\\MerkleTree\\result2.txt");

	return -1;
}

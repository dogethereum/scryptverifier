pragma solidity ^0.4.13;

library KeyDeriv {
    function hmacsha256(bytes key, bytes message) constant returns (bytes32) {
        bytes32 keyl;
        bytes32 keyr;
        uint i;
        if (key.length > 64) {
            keyl = sha256(key);
        } else {
            for (i = 0; i < key.length && i < 32; i++)
                keyl |= bytes32(uint(key[i]) * 2**(8 * (31 - i)));
            for (i = 32; i < key.length && i < 64; i++)
                keyr |= bytes32(uint(key[i]) * 2**(8 * (63 - i)));
        }
        bytes32 threesix = 0x3636363636363636363636363636363636363636363636363636363636363636;
        bytes32 fivec = 0x5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c;
        return sha256(fivec ^ keyl, fivec ^ keyr, sha256(threesix ^ keyl, threesix ^ keyr, message));
    }
    /// PBKDF2 restricted to c=1, hash = hmacsha256 and dklen being a multiple of 32 not larger than 128
    function pbkdf2(bytes key, bytes salt, uint dklen) constant returns (bytes32[4] r) {
        var m = new bytes(salt.length + 4);
        for (uint i = 0; i < salt.length; i++)
            m[i] = salt[i];
        for (i = 0; i * 32 < dklen; i++) {
            m[m.length - 1] = bytes1(uint8(i + 1));
            r[i] = hmacsha256(key, m);
        }
    }
}

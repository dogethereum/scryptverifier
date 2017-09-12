var KeyDeriv = artifacts.require("./KeyDeriv.sol");
var Salsa8 = artifacts.require("./Salsa8.sol");
var ScryptVerifier = artifacts.require("./ScryptVerifier.sol");

module.exports = function(deployer) {
  deployer.deploy(KeyDeriv);
  deployer.link(KeyDeriv, ScryptVerifier);
  deployer.deploy(ScryptVerifier);
  deployer.deploy(Salsa8);
  deployer.link(Salsa8, ScryptVerifier);
};

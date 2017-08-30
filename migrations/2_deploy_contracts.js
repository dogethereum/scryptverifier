var KeyDeriv = artifacts.require("./KeyDeriv.sol");
var Salsa8 = artifacts.require("./Salsa8.sol");
var ScryptTest = artifacts.require("./ScryptTest.sol");

module.exports = function(deployer) {
  deployer.deploy(KeyDeriv);
  deployer.link(KeyDeriv, ScryptTest);
  deployer.deploy(Salsa8);
  deployer.link(Salsa8, ScryptTest);
  deployer.deploy(ScryptTest);
};

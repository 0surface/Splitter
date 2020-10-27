const splitterContract = artifacts.require("Splitter");

//remove this
console.log(web3.currentProvider);

splitterContract("Splitter", (accounts) => {
  it("", () => {
    const testNum = 42;
    assert.equal(testNum, 42, "Test works");
  });
});

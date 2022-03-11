
// Deploys the smart contract
(async () => {
    const contract = await hre.ethers.getContractFactory("Woofy");
    const deployedContract = await contract.deploy();
    await deployedContract.deployed();
    console.log(`Woofy contract deployed to: ${deployedContract.address}`);
})()
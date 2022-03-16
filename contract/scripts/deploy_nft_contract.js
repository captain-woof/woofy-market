const { ethers } = require("hardhat");

// Deploys the smart contract
(async () => {
    const contract = await hre.ethers.getContractFactory("Woofy");
    const deployedContract = await contract.deploy(
        ethers.utils.parseEther("0.1"),
        15 * 60,
        50,
        {
            value: ethers.utils.parseEther("2")
        }
    );
    await deployedContract.deployed();
    console.log(`Woofy contract deployed to: ${deployedContract.address}`);
})()
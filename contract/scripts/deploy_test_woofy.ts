import { ethers } from "hardhat";
import { Contract, Signer, ContractTransaction, BigNumber } from "ethers";
import * as IPFS from "ipfs-core";

// Deploys smart contracts for WOOFY marketplace
// Usage: node scripts/deploy.js [-h] [--dummy-data]

const deploy = async () => {
    const contract = await ethers.getContractFactory("Woofy");
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
    return deployedContract;
}

// MAIN
(async () => {
    try {
        const contract = await deploy();
        // Fill contracts with dummy data for testing
        console.log("Filling with dummy data");

        const [signer1, signer2] = await ethers.getSigners();
        const ipfs = await IPFS.create();
        const tokenIds1: Array<BigNumber> = [];
        const tokenIds2: Array<BigNumber> = [];

        // Mint some WOOFYs
        for (let i = 0; i < 4; i++) {
            const { tokenId: tokenId1 } = await mintWoofy(signer1, "0.1", contract, ipfs);
            tokenIds1.push(tokenId1);
            const { tokenId: tokenId2 } = await mintWoofy(signer2, "0.1", contract, ipfs);
            tokenIds2.push(tokenId2);
        }

        // Set some WOOFYs for sale
        for (let i = 0; i < 2; i++) {
            await putWoofyForSale(contract, tokenIds1[i], signer1);
            await putWoofyForSale(contract, tokenIds2[i], signer2);
        }

        console.log("READY");
    } catch (e) {
        console.log(e);
    }
})()

//// FUNCTIONS
// Function to mint WOOFY
async function mintWoofy(signer: Signer, valueInEth: number | string, baseContract: Contract, ipfs: IPFS.IPFS) {
    const contractConnectedToSigner = baseContract.connect(signer);

    // Mint NFT and create NFT image file, then add it to IPFS
    const createWoofyTxn: ContractTransaction = await contractConnectedToSigner.createNFT({ value: ethers.utils.parseEther(valueInEth.toString()) });
    await createWoofyTxn.wait();
    const tokenId: BigNumber = await contractConnectedToSigner.getNewTokenId();
    const nftImageContent = baseContract.toString().replace("# NUMBER", `#${tokenId.toNumber()}`);
    const { path: nftImageIpfsPath } = await ipfs.add(nftImageContent);
    const txnSetMetadata: ContractTransaction = await contractConnectedToSigner.setNewTokenURI(`ipfs://${nftImageIpfsPath}`);
    await txnSetMetadata.wait();

    // Return
    return { tokenId, nftImageIpfsPath, nftImageContent };
}

// Function to put WOOFY for sale
async function putWoofyForSale(baseContract: Contract, tokenId: BigNumber, signer: Signer) {
    const contractConnectedToSigner = baseContract.connect(signer);
    await contractConnectedToSigner.putForSale(tokenId, ethers.utils.parseEther("1"));
}
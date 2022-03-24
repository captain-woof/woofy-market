import { BigNumber, ContractTransaction, Signer } from "ethers";
import { ethers } from "hardhat";
import * as IPFS from "ipfs-core";
import { Woofy } from "../../typechain-types";
import fs from "fs";
import path from "path";

let woofyImageBase: string;
const getWoofyBaseImage = () => {
    if (!!woofyImageBase) {
        return woofyImageBase;
    } else {
        woofyImageBase = fs.readFileSync(path.join(__dirname, "../", "../", "woofy-image-factory.txt")).toString();
        return woofyImageBase;
    }
}

// Function to mint WOOFY
export async function mintWoofy(signer: Signer, valueInEth: number | string, woofyContract: Woofy, ipfs: IPFS.IPFS) {
    const contractConnectedToSigner = woofyContract.connect(signer);

    // Mint NFT and create NFT image file, then add it to IPFS
    const createWoofyTxn: ContractTransaction = await contractConnectedToSigner.createNFT({ value: ethers.utils.parseEther(valueInEth.toString()) });
    await createWoofyTxn.wait();
    const tokenId: BigNumber = await contractConnectedToSigner.getNewTokenId();
    const nftImageContent = getWoofyBaseImage().replace("# NUMBER", `#${tokenId.toNumber()}`);
    const { path: nftImageIpfsPath } = await ipfs.add(nftImageContent);
    const txnSetMetadata: ContractTransaction = await contractConnectedToSigner.setNewTokenURI(`ipfs://${nftImageIpfsPath}`);
    await txnSetMetadata.wait();

    // Return
    return { tokenId, nftImageIpfsPath, nftImageContent };
}

// Function to put WOOFY for sale
export async function putWoofyForSale(woofyContract: Woofy, tokenId: BigNumber, signer: Signer, priceInMatic: string | number) {
    const contractConnectedToSigner = woofyContract.connect(signer);
    await contractConnectedToSigner.putForSale(tokenId, ethers.utils.parseEther(priceInMatic.toString()));
}
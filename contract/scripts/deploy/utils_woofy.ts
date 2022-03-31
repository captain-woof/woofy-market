import { BigNumber, ContractTransaction, Signer } from "ethers";
import { ethers } from "hardhat";
import { Woofy } from "../../typechain-types";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Web3Storage, File } from "web3.storage";

dotenv.config();
const web3Storage = new Web3Storage({ token: process.env.WEB3_STORAGE_API_KEY as string });

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
export async function mintWoofy(signer: Signer, valueInEth: number | string, woofyContract: Woofy) {
    console.log(`[+] Minting WOOFY`);
    const contractConnectedToSigner = woofyContract.connect(signer);

    // Mint NFT and create NFT image file, then add it to IPFS
    let gasLimit = await contractConnectedToSigner.estimateGas.createNFT({ value: ethers.utils.parseEther(valueInEth.toString()) });
    const createWoofyTxn: ContractTransaction = await contractConnectedToSigner.createNFT({ value: ethers.utils.parseEther(valueInEth.toString()), gasLimit });
    await createWoofyTxn.wait();
    const tokenId: BigNumber = await contractConnectedToSigner.getNewTokenId();
    const nftImageContent = getWoofyBaseImage().replace("# NUMBER", `#${tokenId.toString()}`);

    const cid = await web3Storage.put([new File([nftImageContent], `woofy-nft-${tokenId.toString()}.svg`, { type: "image/svg" })]);
    const path = `${cid}/woofy-nft-${tokenId.toString()}.svg`;
    gasLimit = await contractConnectedToSigner.estimateGas.setNewTokenURI(`ipfs://${path}`);
    const txnSetMetadata: ContractTransaction = await contractConnectedToSigner.setNewTokenURI(`ipfs://${path}`, { gasLimit });
    await txnSetMetadata.wait();

    // Return
    return { tokenId, path, nftImageContent };
}

// Function to put WOOFY for sale
export async function putWoofyForSale(woofyContract: Woofy, tokenId: BigNumber, signer: Signer, priceInMatic: string | number) {
    console.log(`[+] Putting WOOFY ${tokenId.toString()} for sale for ${priceInMatic} MATIC`);
    const contractConnectedToSigner = woofyContract.connect(signer);
    const gasLimit = await contractConnectedToSigner.estimateGas.putForSale(tokenId, ethers.utils.parseEther(priceInMatic.toString()));
    await contractConnectedToSigner.putForSale(tokenId, ethers.utils.parseEther(priceInMatic.toString()), { gasLimit });
}
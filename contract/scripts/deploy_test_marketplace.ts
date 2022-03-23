import { ethers } from "hardhat";
import { Contract, Signer, ContractTransaction, BigNumber } from "ethers";
import * as IPFS from "ipfs-core";

// Deploys WOOFY marketplace contract, NFT implementation contract

const deploy = async () => {
    const nftImplementationContractFactory = await ethers.getContractFactory("Marketplace_NFT");
    const marketplaceContractFactory = await ethers.getContractFactory("Marketplace");

    const nftImplementationContract = await nftImplementationContractFactory.deploy();
    await nftImplementationContract.deployed();
    const marketplaceContract = await marketplaceContractFactory.deploy(nftImplementationContract.address);
    await marketplaceContract.deployed();

    console.log(`
Marketplace NFT implementation deployed to: ${nftImplementationContract.address}
Marketplace deployed to: ${marketplaceContract.address}
    `);
    return {
        nftImplementationContract,
        marketplaceContract
    };
}

// MAIN
(async () => {
    try {
        const { marketplaceContract, nftImplementationContract } = await deploy();
        const [signer1] = await ethers.getSigners();
        //// Fill contracts with dummy data for testing

        // Creating a new NFT collection
        const { nftContractAddr, marketplaceContractConn, nftContract } = await createNftContract(marketplaceContract, signer1, "NAME", "NME");
        console.log(`${await nftContract.name()} NFT contract created: ${nftContractAddr}`);
        const { tokenId: tokenId1 } = await mintNft(nftContract, signer1, "METADATA URI 1");
        const { tokenId: tokenId2 } = await mintNft(nftContract, signer1, "METADATA URI 2");
        const { tokenId: tokenId3 } = await mintNft(nftContract, signer1, "METADATA URI 3");
        console.log("NFTs minted (ids):", tokenId1, tokenId2, tokenId3);

    } catch (e) {
        console.log(e);
    }
})()

//// FUNCTIONS
async function createNftContract(marketplaceContract: Contract, signer: Signer, name: string, symbol: string) {
    const signerAddr = await signer.getAddress();
    const marketplaceContractConn = marketplaceContract.connect(signer);
    const txn: ContractTransaction = await marketplaceContractConn.createNftContract(name, symbol);
    const rcpt = await txn.wait();
    const event = rcpt.events?.find((event) => (event.event === "NftContractCreated" && event.args?.author === signerAddr));
    const nftContractFactory = await ethers.getContractFactory("Marketplace_NFT");
    const nftContract = nftContractFactory.attach(event?.args?.contractAddr as string);

    return {
        nftContractAddr: event?.args?.contractAddr as string,
        marketplaceContractConn,
        nftContract
    };
}

async function mintNft(nftContract: Contract, signer: Signer, metadataUri: string = "DUMMY METADATA URI") {
    const nftContractConn = nftContract.connect(signer);
    const txn: ContractTransaction = await nftContractConn.mintNft(metadataUri);
    const rcpt = await txn.wait();
    const event = rcpt.events?.find((event) => (event.event === "NftMinted" && event.args?.nftContractAddress === nftContractConn.address));

    return {
        tokenId: event?.args?.tokenId,
        tokenUri: event?.args?.tokenUri
    }
}
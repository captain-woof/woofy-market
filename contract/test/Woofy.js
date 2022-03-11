const { assert } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const IPFS = require("ipfs-core");
const path = require("path");

describe("Woofy NFT contract should perform correctly", () => {
    let contract = null;
    let ipfs = null;
    let signers = null;
    let nftImageBaseContent = null;

    // Function to mint NFT
    async function mintNft(signer, valueInEth) {// Connect to contract from signer
        const contractConnectedToSigner = await contract.connect(signer);
        let txn = null;

        // Mint NFT and create NFT image file, then add it to IPFS
        txn = await contractConnectedToSigner.createNFT({ value: ethers.utils.parseEther(valueInEth.toString()) });
        await txn.wait();
        const tokenId = await contractConnectedToSigner.getNewTokenId();
        const nftImageContent = nftImageBaseContent.toString().replace("# NUMBER", `#${tokenId.toNumber()}`);
        const { path: nftImageIpfsPath } = await ipfs.add(nftImageContent);
        txn = await contractConnectedToSigner.setNewTokenURI(`ipfs://${nftImageIpfsPath}`);
        await txn.wait();

        // Return
        return { tokenId, nftImageIpfsPath, nftImageContent };
    }

    // Deploy contract, start an IPFS server, read NFT image and get signers, before anything else
    before(async () => {
        const contractFactory = await ethers.getContractFactory("Woofy");
        contract = await contractFactory.deploy();
        await contract.deployed();
        signers = await ethers.getSigners();
        ipfs = await IPFS.create();
        nftImageBaseContent = fs.readFileSync(path.join(__dirname, "../", "../", "nft-image-factory.txt"));
    });

    it("Contract should have deployed correctly", async () => {
        assert.isNotNull(contract, "Contract was not deployed!");
    });

    it("NFT should be correctly created", async () => {
        const { nftImageIpfsPath, tokenId, nftImageContent } = await mintNft(signers[0], 0.001);

        // Token URI should be correct
        assert.notEqual(tokenId.toNumber(), -1, "Token ID should not be negative!");
        const tokenMetadataUri = await contract.tokenURI(tokenId);
        const tokenMetadata = JSON.parse((Buffer.from(tokenMetadataUri.split("base64,")[1], "base64")).toString());
        assert.includeMembers(Object.keys(tokenMetadata), ["name", "description", "attributes", "image"], "NFT Metadata is missing some properties!");
        assert.equal(tokenMetadata.image, `ipfs://${nftImageIpfsPath}`, "NFT metadata has wrong reference to image!");

        // Read file from IPFS and check
        let nftImageContentIpfs = ipfs.cat(nftImageIpfsPath);
        const nftImageContentIpfsPieces = [];
        for await (let piece of nftImageContentIpfs) {
            nftImageContentIpfsPieces.push(piece.toString());
        }
        nftImageContentIpfs = nftImageContentIpfsPieces.reduce((prev, curr) => prev + curr);
        assert.equal(nftImageContentIpfs, nftImageContent, "NFT image content was not stored correctly!");
    });

    it("NFTs must be unique", async () => {
        const nftDetails1 = await mintNft(signers[1], 0.001);
        const nftDetails2 = await mintNft(signers[2], 0.001);

        assert.notDeepEqual(nftDetails1, nftDetails2, "NFTs must be unique!");
    })
});
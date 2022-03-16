const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const IPFS = require("ipfs-core");
const path = require("path");
const { BigNumber } = require("ethers");

const PRICE = 0.01; // MATIC
const COOLDOWN_PERIOD = 10; // secs
const MAX_SUPPLY = 15; // Max number of WOOFYs
const PRICE_FORMATTED = hre.ethers.utils.parseEther(PRICE.toString());

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
        contract = await contractFactory.deploy(PRICE_FORMATTED, COOLDOWN_PERIOD, MAX_SUPPLY);
        await contract.deployed();
        signers = await ethers.getSigners();
        ipfs = await IPFS.create();
        nftImageBaseContent = fs.readFileSync(path.join(__dirname, "../", "../", "nft-image-factory.txt"));
    });

    it("Contract should have deployed correctly, with all constants initialized", async () => {
        assert.isNotNull(contract, "Contract was not deployed!");

        const priceActual = await contract.PRICE();
        assert.equal(priceActual.toString(), PRICE_FORMATTED, "WOOFY price was not set correctly!");

        const cooldownPeriodActual = await contract.COOLDOWN_PERIOD();
        assert.equal(cooldownPeriodActual.toNumber(), COOLDOWN_PERIOD, "Cooldown period was not set correctly!");

        const maxSupplyActual = await contract.MAX_SUPPLY();
        assert.equal(maxSupplyActual.toNumber(), MAX_SUPPLY, "Max supply was not set correctly!");
    });

    it("NFT should be correctly created", async () => {
        const { nftImageIpfsPath, tokenId, nftImageContent } = await mintNft(signers[0], 0.01);

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
        const nftDetails1 = await mintNft(signers[1], 0.01);
        const nftDetails2 = await mintNft(signers[2], 0.01);
        assert.notDeepEqual(nftDetails1, nftDetails2, "NFTs must be unique!");
    })

    it("Signer's stored NFTs' metadata should return correctly", async () => {
        const signer = signers[4];
        const { tokenId: tokenId1, nftImageIpfsPath: nftImageIpfsPath1 } = await mintNft(signer, 0.01);
        const { tokenId: tokenId2, nftImageIpfsPath: nftImageIpfsPath2 } = await mintNft(signer, 0.01);
        const contractConn = await contract.connect(signer);
        let nftsOwned = await contractConn.getAllNftsOwned();
        nftsOwned = nftsOwned.map((nftOwned) => ({
            tokenId: nftOwned.tokenID,
            ...(JSON.parse((Buffer.from(nftOwned.tokenURI.split("base64,")[1], "base64")).toString()))
        }));

        assert.equal(nftsOwned[0].tokenId.toNumber(), tokenId1.toNumber(), "Signer's stored NFT's ID was not returned correctly!");
        assert.equal(nftsOwned[1].tokenId.toNumber(), tokenId2.toNumber(), "Signer's stored NFT's ID was not returned correctly!");

        assert.equal(nftsOwned[0].image, `ipfs://${nftImageIpfsPath1}`, "Signer's stored NFT's image path was not returned correctly!");
        assert.equal(nftsOwned[1].image, `ipfs://${nftImageIpfsPath2}`, "Signer's stored NFT's image path was not returned correctly!");
    })

    it("Selling and then buying should be handled correctly", async () => {
        const [buyer, seller] = [signers[5], signers[6]];
        const { tokenId } = await mintNft(seller, 0.01);
        const contractConnWithSeller = await contract.connect(seller);
        const contractConnWithBuyer = await contract.connect(buyer);

        await expect(contractConnWithSeller.putForSale(1, hre.ethers.utils.parseEther("0.01"))).to.be.revertedWith("SIGNER IS NOT OWNER OF THE TOKEN");
        await contractConnWithSeller.putForSale(tokenId, hre.ethers.utils.parseEther("1"));
        await expect(contractConnWithSeller.putForSale(tokenId, hre.ethers.utils.parseEther("1"))).to.be.revertedWith("TOKEN IS ALREADY FOR SALE.");
        await expect(contractConnWithSeller.buy(tokenId, { value: hre.ethers.utils.parseEther("1") })).to.be.revertedWith("SIGNER IS ALREADY THE OWNER OF THE TOKEN");
        const sellerBalanceBeforeSelling = await hre.ethers.provider.getBalance(seller.address);


        await expect(contractConnWithBuyer.buy(tokenId, { value: hre.ethers.utils.parseEther("0.8") })).to.be.revertedWith("INCORRECT VALUE SENT FOR PURCHASING; CORRECT VALUE: 1000000000000000000");

        await contractConnWithBuyer.buy(tokenId, { value: hre.ethers.utils.parseEther("1") });
        const sellerBalanceAfterSelling = await hre.ethers.provider.getBalance(seller.address);
        const amountGainedActual = sellerBalanceAfterSelling.sub(sellerBalanceBeforeSelling);
        const amountGainedExpected = hre.ethers.utils.parseEther("1");
        const errorPercentage = 2;
        const diff = amountGainedExpected.sub(amountGainedActual);
        const diffMax = amountGainedExpected.mul(errorPercentage).div(100);
        assert.isTrue(diff.lte(diffMax), "Seller did not receive the correct price from selling his NFT!");

        await expect(contractConnWithBuyer.buy(tokenId, { value: hre.ethers.utils.parseEther("1") })).to.be.revertedWith("SIGNER IS ALREADY THE OWNER OF THE TOKEN");
    })

    it("Selling, cancelling and then buying should be handled correctly", async () => {
        const [buyer, seller] = [signers[5], signers[6]];
        const { tokenId } = await mintNft(seller, 0.01);
        const contractConnWithSeller = await contract.connect(seller);
        const contractConnWithBuyer = await contract.connect(buyer);

        await contractConnWithSeller.putForSale(tokenId, hre.ethers.utils.parseEther("1"));
        await contractConnWithSeller.cancelSale(tokenId);
        await expect(contractConnWithBuyer.buy(tokenId, { value: hre.ethers.utils.parseEther("1") })).to.be.revertedWith("TOKEN IS NOT FOR SALE.");
    })

    after("Cannot create more than specified number of WOOFYs", async () => {
        const currentSupply = await contract.totalSupply();
        const remaining = MAX_SUPPLY - currentSupply.toNumber();
        const signer = signers[8];
        for (let i = 0; i < remaining; i++) {
            await mintNft(signer, 0.01);
        }
        await expect(mintNft(signer, 0.01)).to.be.revertedWith("MAX NUMBER OF WOOFYs IN CIRCULATION ALREADY!");
    })
});
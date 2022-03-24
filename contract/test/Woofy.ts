import chai from "chai";
import chai_as_promised from "chai-as-promised";
import fs from "fs";
import * as IPFS from "ipfs-core";
import path from "path";
import { ethers } from "hardhat";
import { Woofy } from "../typechain-types";
import { BigNumber, Signer } from "ethers";

chai.use(chai_as_promised);
const { assert, expect } = chai;

interface WoofyStructured {
    tokenId: BigNumber;
    name: string;
    description: string;
    attributes: Array<Object>;
    image: string;
}

const PRICE = 0.01; // MATIC
const COOLDOWN_PERIOD = 10; // secs
const MAX_SUPPLY = 15; // Max number of WOOFYs
const PRICE_FORMATTED = ethers.utils.parseEther(PRICE.toString());

describe("Woofy NFT contract should perform correctly", () => {
    let contract: Woofy;
    let ipfs: IPFS.IPFS;
    let signers: Array<Signer>;
    let nftImageBaseContent: Buffer;

    // Deploy contract, start an IPFS server, read NFT image and get signers, before anything else
    before(async () => {
        const contractFactory = await ethers.getContractFactory("Woofy");
        contract = await contractFactory.deploy(PRICE_FORMATTED, COOLDOWN_PERIOD, MAX_SUPPLY);
        await contract.deployed();
        signers = await ethers.getSigners();
        ipfs = await IPFS.create();
        nftImageBaseContent = fs.readFileSync(path.join(__dirname, "../", "woofy-image-factory.txt"));
    });

    it("Contract should have deployed correctly, with all constants initialized", async () => {
        assert.isNotNull(contract, "Contract was not deployed!");

        const priceActual = await contract.PRICE();
        assert.isTrue(priceActual.eq(PRICE_FORMATTED), "WOOFY price was not set correctly!");

        const cooldownPeriodActual = await contract.COOLDOWN_PERIOD();
        assert.isTrue(cooldownPeriodActual.eq(COOLDOWN_PERIOD), "Cooldown period was not set correctly!");

        const maxSupplyActual = await contract.MAX_SUPPLY();
        assert.isTrue(maxSupplyActual.eq(MAX_SUPPLY), "Max supply was not set correctly!");
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
        const nftImageContentIpfsPieces: Array<string> = [];
        for await (let piece of nftImageContentIpfs) {
            nftImageContentIpfsPieces.push(piece.toString());
        }
        const nftImageContentIpfsStr = nftImageContentIpfsPieces.reduce((prev, curr) => prev + curr);
        assert.equal(nftImageContentIpfsStr, nftImageContent, "NFT image content was not stored correctly!");
    });

    it("NFTs must be unique", async () => {
        const nftDetails1 = await mintNft(signers[1], 0.01);
        const nftDetails2 = await mintNft(signers[2], 0.01);
        assert.notDeepEqual(nftDetails1, nftDetails2, "NFTs must be unique!");
    })

    it("Signer's stored NFTs' metadata should return correctly", async () => {
        const signer = signers[3];
        const { tokenId: tokenId1, nftImageIpfsPath: nftImageIpfsPath1 } = await mintNft(signer, 0.01);
        const { tokenId: tokenId2, nftImageIpfsPath: nftImageIpfsPath2 } = await mintNft(signer, 0.01);
        const contractConn = contract.connect(signer);
        let nftsOwned = await contractConn.getAllNftsOwned();
        const nftsOwnedStructured: Array<WoofyStructured> = nftsOwned.map(({ tokenId, tokenUri }) => ({
            tokenId,
            ...(JSON.parse((Buffer.from(tokenUri.split("base64,")[1], "base64")).toString()))
        }));

        assert.equal(nftsOwnedStructured[0].tokenId.toNumber(), tokenId1.toNumber(), "Signer's stored NFT's ID was not returned correctly!");
        assert.equal(nftsOwnedStructured[1].tokenId.toNumber(), tokenId2.toNumber(), "Signer's stored NFT's ID was not returned correctly!");

        assert.equal(nftsOwnedStructured[0].image, `ipfs://${nftImageIpfsPath1}`, "Signer's stored NFT's image path was not returned correctly!");
        assert.equal(nftsOwnedStructured[1].image, `ipfs://${nftImageIpfsPath2}`, "Signer's stored NFT's image path was not returned correctly!");
    })

    it("Selling and then buying should be handled correctly", async () => {
        const [buyer, seller] = [signers[4], signers[5]];
        const { tokenId } = await mintNft(seller, 0.01);
        const contractConnWithSeller = contract.connect(seller);
        const contractConnWithBuyer = contract.connect(buyer);

        await expect(contractConnWithSeller.putForSale(1, ethers.utils.parseEther("0.01"))).to.be.revertedWith("SIGNER IS NOT OWNER OF THE TOKEN");
        await contractConnWithSeller.putForSale(tokenId, ethers.utils.parseEther("1"));
        await expect(contractConnWithSeller.putForSale(tokenId, ethers.utils.parseEther("1"))).to.be.revertedWith("TOKEN IS ALREADY FOR SALE.");
        await expect(contractConnWithSeller.buy(tokenId, { value: ethers.utils.parseEther("1") })).to.be.revertedWith("SIGNER IS ALREADY THE OWNER OF THE TOKEN");
        const sellerBalanceBeforeSelling = await ethers.provider.getBalance(await seller.getAddress());


        await expect(contractConnWithBuyer.buy(tokenId, { value: ethers.utils.parseEther("0.8") })).to.be.revertedWith("INCORRECT VALUE SENT FOR PURCHASING; CORRECT VALUE: 1000000000000000000");

        await contractConnWithBuyer.buy(tokenId, { value: ethers.utils.parseEther("1") });
        const sellerBalanceAfterSelling = await ethers.provider.getBalance(await seller.getAddress());
        const amountGainedActual = sellerBalanceAfterSelling.sub(sellerBalanceBeforeSelling);
        const amountGainedExpected = ethers.utils.parseEther("1");
        const errorPercentage = 2;
        const diff = amountGainedExpected.sub(amountGainedActual);
        const diffMax = amountGainedExpected.mul(errorPercentage).div(100);
        assert.isTrue(diff.lte(diffMax), "Seller did not receive the correct price from selling his NFT!");

        await expect(contractConnWithBuyer.buy(tokenId, { value: ethers.utils.parseEther("1") })).to.be.revertedWith("SIGNER IS ALREADY THE OWNER OF THE TOKEN");
    })

    it("Selling, cancelling and then buying should be handled correctly", async () => {
        const [buyer, seller] = [signers[4], signers[5]];
        const { tokenId } = await mintNft(seller, 0.01);
        const contractConnWithSeller = contract.connect(seller);
        const contractConnWithBuyer = contract.connect(buyer);

        await contractConnWithSeller.putForSale(tokenId, ethers.utils.parseEther("1"));
        await contractConnWithSeller.cancelSale(tokenId);
        await expect(contractConnWithBuyer.buy(tokenId, { value: ethers.utils.parseEther("1") })).to.be.revertedWith("TOKEN IS NOT FOR SALE.");
    })

    it("WOOFYs for sale should return correctly", async () => {
        const cf = await ethers.getContractFactory("Woofy");
        const c = await cf.deploy(PRICE_FORMATTED, COOLDOWN_PERIOD, MAX_SUPPLY);
        await c.deployed();

        const signer1 = signers[0];
        const signer2 = signers[1];
        const signer3 = signers[2];
        const contractConn1 = c.connect(signer1);
        const contractConn2 = c.connect(signer2);
        const contractConn3 = c.connect(signer3);

        const nftsForSaleTotalInitial = await contractConn3.getAllNftsForSale();
        assert.equal(nftsForSaleTotalInitial.length.toString(), "0", "Initial number of WOOFYs for sale is not 0!");

        for (let i = 0; i < 3; i++) {
            await mintNft(signer1, 0.01, c);
        }
        await contractConn1.putForSale(1, ethers.utils.parseEther("1"));

        for (let i = 0; i < 4; i++) {
            await mintNft(signer2, 0.01, c);
        }
        await contractConn2.putForSale(4, ethers.utils.parseEther("2"));

        for (let i = 0; i < 2; i++) {
            await mintNft(signer3, 0.01, c);
        }
        await contractConn3.putForSale(8, ethers.utils.parseEther("2"));

        const nftsForSaleTotal = await contractConn3.getAllNftsForSale();
        const signer3Addr = await signer3.getAddress();
        const mftsForSaleNotOwned = nftsForSaleTotal.filter((nftForSale) => nftForSale.owner !== signer3Addr);
        assert.equal(nftsForSaleTotal.length.toString(), "3", "Number of WOOFYs for sale not returned correctly!");
        assert.equal(mftsForSaleNotOwned.length.toString(), "2", "Number of WOOFYs for sale and not owned by signer not returned correctly!");
    })

    after("Cannot create more than specified number of WOOFYs", async () => {
        const currentSupply = await contract.totalSupply();
        const remaining = MAX_SUPPLY - currentSupply.toNumber();
        const signer = signers[5];
        for (let i = 0; i < remaining; i++) {
            await mintNft(signer, 0.01);
        }
        await expect(mintNft(signer, 0.01)).to.be.revertedWith("MAX NUMBER OF WOOFYs IN CIRCULATION ALREADY!");
    })

    //// FUNCTIONS
    // Function to mint NFT
    async function mintNft(signer: Signer, valueInEth: number | string, contractCustom: Woofy = contract) {// Connect to contract from signer
        const contractConnectedToSigner = contractCustom.connect(signer);
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
});
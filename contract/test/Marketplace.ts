import chai from "chai";
import chai_as_promised from "chai-as-promised";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers } from "hardhat";
import { Marketplace, NFT, Woofy } from "../typechain-types";
import { NftBoughtEvent, NftMintedEvent, NftOnSaleEvent, NftSaleCancelEvent } from "../typechain-types/NFT";
import { NftContractCreatedEvent } from "../typechain-types/Marketplace";

// Chai
chai.use(chai_as_promised);
const { expect, assert } = chai;

describe("> Marketplace and NFT contracts should all work correctly", async () => {

    // CONSTANTS
    let marketplaceContract: Marketplace;
    let woofyContract: Woofy;
    let marketplaceNftContractImpl: NFT;
    let signers: Array<Signer>;

    before(async () => {
        // Get signers
        signers = await ethers.getSigners();
    });

    beforeEach(async () => {
        // Deploy Woofy contract
        const woofyContractFactory = await ethers.getContractFactory("Woofy");
        woofyContract = await woofyContractFactory.deploy(
            ethers.utils.parseEther("0.2"), // Woofy priced at 0.2 matic,
            BigNumber.from(15 * 60), // cooldown - 15 mins
            BigNumber.from(50), // Max woofys
        );
        await woofyContract.deployed();

        // Deploy Marketplace NFT contract Implementation
        const marketplaceNftContractImplFactory = await ethers.getContractFactory("NFT");
        marketplaceNftContractImpl = await marketplaceNftContractImplFactory.deploy();
        await marketplaceNftContractImpl.deployed();

        // Deploy marketplace
        const marketplaceContractFactory = await ethers.getContractFactory("Marketplace");
        marketplaceContract = await marketplaceContractFactory.deploy(
            marketplaceNftContractImpl.address,
            woofyContract.address
        );
        await marketplaceContract.deployed();
    });

    // Marketplace contract can deploy NFT contract clones
    it("Marketplace contract can deploy NFT contract clones", async () => {
        const nftContract = await createNftContract(marketplaceContract, signers[0], "NFT COLL 1", "C1", "Description for collection 1");
        await expect(nftContract.name()).eventually.equal("NFT COLL 1", "NFT clone stored incorrect collection name");
        await expect(nftContract.symbol()).eventually.equal("C1", "NFT clone stored incorrect collection symbol");
        await expect(nftContract.description()).eventually.equal("Description for collection 1", "NFT clone stored incorrect collection description");
        await expect(nftContract.authorAddr()).eventually.equal(await (signers[0].getAddress()), "NFT clone stored incorrect author address");
    });

    // Marketplace contract should mint NFTs correctly and implement access control
    it("Marketplace contract should mint NFTs correctly and implement access control", async () => {
        const nftContract = await createNftContract(marketplaceContract, signers[0], "NFT COLL 2", "C2", "Description for collection 2");

        await expect(nftContract.connect(signers[1]).mintNft("Metadata URI")).to.be.revertedWith("SIGNER IS NOT NFT COLLECTION AUTHOR");
        const { tokenUri: tokenUri1, tokenId: tokenId1 } = await mintNft(nftContract, signers[0], "METADATA URI 1");
        const { tokenUri: tokenUri2, tokenId: tokenId2 } = await mintNft(nftContract, signers[0], "METADATA URI 2");
        assert.equal(tokenUri1, "METADATA URI 1", "NFT metadata was not stored correctly");
        assert.equal(tokenUri2, "METADATA URI 2", "NFT metadata was not stored correctly");
        assert.isFalse(tokenId1.eq(tokenId2), "NFT token IDs are not unique");
        assert.equal(await nftContract.ownerOf(tokenId1), await (signers[0].getAddress()), "NFT was minted to incorrected address");
    });

    // Marketplace contract should put/buy/cancel NFTs for sale correctly, implement access control
    it("Marketplace contract should put/buy/cancel NFTs for sale correctly and implement access control", async () => {
        const nftContract = await createNftContract(marketplaceContract, signers[0], "NFT COLL 4", "C4", "Description for collection 4");
        const { tokenId: tokenId1 } = await mintNft(nftContract, signers[0], "METADATA URI 1");
        const { tokenId: tokenId2 } = await mintNft(nftContract, signers[0], "METADATA URI 2");
        const { tokenId: tokenId3 } = await mintNft(nftContract, signers[0], "METADATA URI 3");

        await expect(nftContract.connect(signers[0]).putNftForSale(30, 2)).revertedWith("INVALID TOKEN ID");
        await expect(nftContract.connect(signers[1]).putNftForSale(tokenId1, 2)).revertedWith("SIGNER IS NOT OWNER OF TOKEN");

        await putNftForSale(nftContract, signers[0], tokenId1, 2);
        await putNftForSale(nftContract, signers[0], tokenId2, 3);
        await putNftForSale(nftContract, signers[0], tokenId3, 5);
        await expect(nftContract.connect(signers[0]).putNftForSale(tokenId1, 2)).revertedWith("NFT SET FOR SALE ALREADY");

        await expect(nftContract.connect(signers[0]).cancelNftForSale(30)).revertedWith("INVALID TOKEN ID");
        await expect(nftContract.connect(signers[1]).cancelNftForSale(tokenId1)).revertedWith("SIGNER IS NOT OWNER OF TOKEN");
        await cancelNftForSale(nftContract, signers[0], tokenId1);
        await expect(nftContract.connect(signers[0]).cancelNftForSale(tokenId1)).revertedWith("NFT IS NOT FOR SALE");

        await expect(nftContract.connect(signers[1]).buyNftForSale(30)).revertedWith("INVALID TOKEN ID");
        await expect(nftContract.connect(signers[1]).buyNftForSale(tokenId1)).revertedWith("NFT IS NOT FOR SALE");
        await expect(nftContract.connect(signers[1]).buyNftForSale(tokenId2, { value: ethers.utils.parseEther("1") })).revertedWith("INCORRECT VALUE SENT; SEND: 3000000000000000000");
        await expect(nftContract.connect(signers[0]).buyNftForSale(tokenId2)).revertedWith("SIGNER IS ALREADY OWNER OF TOKEN");
        await buyNftForSale(nftContract, signers[1], tokenId2, "3");
        await expect(nftContract.ownerOf(tokenId2)).eventually.equal(await signers[1].getAddress());
    });

    it("Individual NFT contract must list out NFTs correctly", async () => {
        const nftContract = await createNftContract(marketplaceContract, signers[0], "NFT COLL 5", "C5", "Description for collection 5");
        const { tokenId: tokenId1 } = await mintNft(nftContract, signers[0], "METADATA URI 1");
        const { tokenId: tokenId2 } = await mintNft(nftContract, signers[0], "METADATA URI 2");
        const { tokenId: tokenId3 } = await mintNft(nftContract, signers[0], "METADATA URI 3");
        const { tokenId: tokenId4 } = await mintNft(nftContract, signers[0], "METADATA URI 4");
        await putNftForSale(nftContract, signers[0], tokenId2, 2);
        await putNftForSale(nftContract, signers[0], tokenId3, 3);
        await buyNftForSale(nftContract, signers[1], tokenId2, 2);

        const allNfts = structureIntoNftArr(await nftContract.getAllNfts());
        assert.equal(allNfts.length, 4, "Incorrect length of All nfts array received");
        await expect(nftContract.tokenByIndex(0)).eventually.equal(tokenId1, "Incorrect token ID returned");
        await expect(nftContract.tokenByIndex(1)).eventually.equal(tokenId2, "Incorrect token ID returned");
        await expect(nftContract.tokenByIndex(2)).eventually.equal(tokenId3, "Incorrect token ID returned");
        await expect(nftContract.tokenByIndex(3)).eventually.equal(tokenId4, "Incorrect token ID returned");

        const owned0 = structureIntoNftArr(await nftContract.connect(signers[0]).getNftsOwned());
        const owned1 = structureIntoNftArr(await nftContract.connect(signers[1]).getNftsOwned());
        assert.equal(owned0.length, 3, "Incorrect length of Owned nfts array received");
        assert.equal(owned1.length, 1, "Incorrect length of Owned nfts array received");

        const nftsOnSale = structureIntoNftArr(await nftContract.getNftsOnSale());
        expect(nftContract.getNftsOnSaleNum()).eventually.equal(1, "Incorrect num of on-sale NFTs returned");
        assert.equal(nftsOnSale.length, 1, "Incorrect num of on-sale NFTs returned");
    });

    it("Marketplace should correctly return collectivised data from all NFT contracts", async () => {
        const nftContract0 = await createNftContract(marketplaceContract, signers[0], "NFT COLL 6", "C6", "Description for collection 6");
        const { tokenId: tokenId1C0 } = await mintNft(nftContract0, signers[0], "METADATA URI 1");
        const { tokenId: tokenId2C0 } = await mintNft(nftContract0, signers[0], "METADATA URI 2");
        await putNftForSale(nftContract0, signers[0], tokenId1C0, 2);
        await putNftForSale(nftContract0, signers[0], tokenId2C0, 3);
        await buyNftForSale(nftContract0, signers[1], tokenId2C0, 3);

        const nftContract1 = await createNftContract(marketplaceContract, signers[1], "NFT COLL 7", "C7", "Description for collection 7");
        const { tokenId: tokenId1C1 } = await mintNft(nftContract1, signers[1], "METADATA URI 1");
        const { tokenId: tokenId2C1 } = await mintNft(nftContract1, signers[1], "METADATA URI 2");
        const { tokenId: tokenId3C1 } = await mintNft(nftContract1, signers[1], "METADATA URI 3");
        const { tokenId: tokenId4C1 } = await mintNft(nftContract1, signers[1], "METADATA URI 4");
        await putNftForSale(nftContract1, signers[1], tokenId3C1, 2);
        await putNftForSale(nftContract1, signers[1], tokenId4C1, 3);
        await buyNftForSale(nftContract1, signers[0], tokenId3C1, 2);

        const nftContract2 = await createNftContract(marketplaceContract, signers[2], "NFT COLL 8", "C8", "Description for collection 8");
        await mintNft(nftContract2, signers[2], "METADATA URI 1");

        const allNftCollections = await marketplaceContract.getAllNftCollections();
        assert.equal(allNftCollections.length, 3, "Incorrect number of NFT collections returned");
        assert.isTrue(allNftCollections[0].nftsInCollection[0].tokenId.eq(tokenId1C0), "Invalid token ID returned while getting All NFT collections");
        assert.isTrue(allNftCollections[0].nftsInCollection[1].tokenId.eq(tokenId2C0), "Invalid token ID returned while getting All NFT collections");
        assert.isTrue(allNftCollections[1].nftsInCollection[0].tokenId.eq(tokenId1C1), "Invalid token ID returned while getting All NFT collections");
        assert.isTrue(allNftCollections[1].nftsInCollection[1].tokenId.eq(tokenId2C1), "Invalid token ID returned while getting All NFT collections");
        assert.isTrue(allNftCollections[1].nftsInCollection[2].tokenId.eq(tokenId3C1), "Invalid token ID returned while getting All NFT collections");
        assert.isTrue(allNftCollections[1].nftsInCollection[3].tokenId.eq(tokenId4C1), "Invalid token ID returned while getting All NFT collections");

        const nftCollectionsWhereOwnerOwns = await marketplaceContract.connect(signers[1]).getNftsCollectionsWhereOwnerOwnsTokens();
        const nftsOwned1 = nftCollectionsWhereOwnerOwns.map((nftCollection) => nftCollection.nftsInCollection).flat();
        assert.equal(nftsOwned1.length, 4, "Incorrect number of NFTs owned returned");
        assert.isTrue(nftsOwned1[0].tokenId.eq(tokenId2C0), "Invalid token ID returned while getting NFT collections where owner owns token");
        assert.isTrue(nftsOwned1[1].tokenId.eq(tokenId1C1), "Invalid token ID returned while getting NFT collections where owner owns token");
        assert.isTrue(nftsOwned1[2].tokenId.eq(tokenId2C1), "Invalid token ID returned while getting NFT collections where owner owns token");
        assert.isTrue(nftsOwned1[3].tokenId.eq(tokenId4C1), "Invalid token ID returned while getting NFT collections where owner owns token");

        const nftCollectionsWhereTokensOnSale = await marketplaceContract.getNftCollectionsWhereTokensOnSale();
        assert.equal(nftCollectionsWhereTokensOnSale.length, 2, "Incorrect number of NFT collections returned where tokens are on sale");
        assert.equal(nftCollectionsWhereTokensOnSale[0].nftsInCollection.length, 1, "Incorrect number of NFTs returned in NFT collections where tokens are on sale");
        assert.equal(nftCollectionsWhereTokensOnSale[1].nftsInCollection.length, 1, "Incorrect number of NFTs returned in NFT collections where tokens are on sale");
        assert.isTrue(nftCollectionsWhereTokensOnSale[0].nftsInCollection[0].tokenId.eq(tokenId1C0), "Invalid token ID returned while getting NFT collections where tokens are on sale");
        assert.isTrue(nftCollectionsWhereTokensOnSale[1].nftsInCollection[0].tokenId.eq(tokenId4C1), "Invalid token ID returned while getting NFT collections where tokens are on sale");

        const nftCollectionsAuthored = await marketplaceContract.connect(signers[0]).getNftsCollectionsAuthored();
        assert.equal(nftCollectionsAuthored.length, 1, "Incorrect number of NFT collections authored returned");
        assert.isTrue(nftCollectionsAuthored[0].nftsInCollection[0].tokenId.eq(tokenId1C0), "Invalid token ID returned while getting All NFT collections authored");
        assert.isTrue(nftCollectionsAuthored[0].nftsInCollection[1].tokenId.eq(tokenId2C0), "Invalid token ID returned while getting All NFT collections authored");
    });
});

// Helper Functions
async function createNftContract(marketplaceContract: Marketplace, signer: Signer, name: string, symbol: string, description: string) {
    const txn = await marketplaceContract.connect(signer).createNftContract(name, symbol, description);
    const rcpt = await txn.wait();
    const event: NftContractCreatedEvent = rcpt.events?.find((event) => event.event === "NftContractCreated") as NftContractCreatedEvent;
    const nftContractCloneAddr = event.args.contractAddr;
    const nftContractCloneFactory = await ethers.getContractFactory("NFT");
    return nftContractCloneFactory.attach(nftContractCloneAddr);
}

async function mintNft(nftContract: NFT, signer: Signer, metadataUri: string) {
    const txn = await nftContract.connect(signer).mintNft(metadataUri);
    const rcpt = await txn.wait();
    const event: NftMintedEvent = rcpt.events?.find((event) => event.event === "NftMinted") as NftMintedEvent;
    return event.args;
}

async function putNftForSale(nftContract: NFT, signer: Signer, tokenId: BigNumberish, priceInMatic: string | number) {
    const txn = await nftContract.connect(signer).putNftForSale(tokenId, ethers.utils.parseEther(priceInMatic.toString()));
    const rcpt = await txn.wait();
    const event = rcpt.events?.find(({ event }) => event === "NftOnSale") as NftOnSaleEvent;
    return event.args;
}

async function cancelNftForSale(nftContract: NFT, signer: Signer, tokenId: BigNumberish) {
    const txn = await nftContract.connect(signer).cancelNftForSale(tokenId);
    const rcpt = await txn.wait();
    const event = rcpt.events?.find(({ event }) => event === "NftSaleCancel") as NftSaleCancelEvent;
    return event.args;
}

async function buyNftForSale(nftContract: NFT, signer: Signer, tokenId: BigNumberish, priceInMatic: string | number) {
    const txn = await nftContract.connect(signer).buyNftForSale(tokenId, { value: ethers.utils.parseEther(priceInMatic.toString()) });
    const rcpt = await txn.wait();
    const event = rcpt.events?.find(({ event }) => event === "NftBought") as NftBoughtEvent;
    return event.args;
}

function structureIntoNftArr(nftsData: [BigNumber[], string[], string[], BigNumber[]] & {
    ids: BigNumber[];
    uris: string[];
    owners: string[];
    prices: BigNumber[];
}) {
    return nftsData.ids.map((id, index) => ({
        tokenId: id,
        tokenUri: nftsData.uris[index],
        tokenOwner: nftsData.owners[index],
        tokenPrice: nftsData.prices[index]
    }));
}
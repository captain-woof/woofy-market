import { ethers, ethernal } from "hardhat";
import { Marketplace, NFT, Woofy } from "../../typechain-types";
import { BigNumber } from "ethers";
import { mintWoofy, putWoofyForSale } from "./utils_woofy";
import { buyNftForSale, createIpfsFromCid, createJsonUriBase64, createNftContract, mintNft, putNftForSale } from "./utils_markeplace";
import "hardhat-ethernal";

let woofyContract: Woofy;
let nftImplContract: NFT;
let marketplaceContract: Marketplace;

// Function to deploy Woofy contract
const deployWoofyContract = async () => {
    const woofyContractFactory = await ethers.getContractFactory("Woofy");
    const woofyContract = await woofyContractFactory.deploy(
        ethers.utils.parseEther("0.1"), // Woofy const 0.1 matic to mint
        15 * 60, // 15 mins cooldown time
        50, // Max WOOFYs
        {
            value: ethers.utils.parseEther("2") // Loading contract with 2 matic
        }
    );
    await woofyContract.deployed();
    await ethernal.push({
        name: "Woofy",
        address: woofyContract.address
    });
    return woofyContract;
}

// Function to deploy NFT implementation contract
const deployNftImplContract = async () => {
    const nftImplContractFactory = await ethers.getContractFactory("NFT");
    const nftImplContract = await nftImplContractFactory.deploy();
    await nftImplContract.deployed();
    return nftImplContract;
}

// Function to deploy marketplace
const deployMarketplaceContract = async (nftImplContractAddr: string, woofyContractAddr: string) => {
    const marketplaceContractFactory = await ethers.getContractFactory("Marketplace");
    const marketplaceContract = await marketplaceContractFactory.deploy(nftImplContractAddr, woofyContractAddr);
    await marketplaceContract.deployed();
    await ethernal.push({
        name: "Marketplace",
        address: marketplaceContract.address
    });
    return marketplaceContract;
}

// Function to deploy all contracts
const deployAllContracts = async () => {
    console.log("Deploying all contracts...");
    woofyContract = await deployWoofyContract();
    nftImplContract = await deployNftImplContract();
    marketplaceContract = await deployMarketplaceContract(nftImplContract.address, woofyContract.address);
    console.table([["Woofy", woofyContract.address], ["NFT Implementation", nftImplContract.address], ["Marketplace", marketplaceContract.address]]);
    return { woofyContract, nftImplContract, marketplaceContract };
}

// Function to fill Woofy contract with dummy data
const fillWoofyWithDummyData = async () => {
    console.log("Filling Woofy contract with dummy data...");

    const [signer1, signer2] = await ethers.getSigners();
    const tokenIds1: Array<BigNumber> = [];
    const tokenIds2: Array<BigNumber> = [];

    // Mint some WOOFYs
    for (let i = 0; i < 4; i++) {
        const { tokenId: tokenId1 } = await mintWoofy(signer1, "0.1", woofyContract);
        tokenIds1.push(tokenId1);
        const { tokenId: tokenId2 } = await mintWoofy(signer2, "0.1", woofyContract);
        tokenIds2.push(tokenId2);
    }

    // Set some WOOFYs for sale
    for (let i = 0; i < 2; i++) {
        await putWoofyForSale(woofyContract, tokenIds1[i], signer1, "3");
        await putWoofyForSale(woofyContract, tokenIds2[i], signer2, "5");
    }
}

// Function to fill Marketplace with dummy data
const fillMarketplaceWithDummyData = async () => {
    console.log("Filling Marketplace contract with dummy data...");

    const signers = await ethers.getSigners();

    const nftContractAnimals = await createNftContract(marketplaceContract, signers[0], "Artistic Animals", "AAN", "A collection of artistic paintings of wild animals.");
    const { tokenId: tokenId1 } = await mintNft(nftContractAnimals, signers[0], createJsonUriBase64({
        name: "Deer",
        description: "A digital portrait of a deer, made with colored polygons.",
        image: createIpfsFromCid("bafybeiegwhcb3vvwggsp7csj2zl5ay6sspvzf7o6xvgqacndqbrxyqgska/deer.jpg")
    }));
    const { tokenId: tokenId2 } = await mintNft(nftContractAnimals, signers[0], createJsonUriBase64({
        name: "Tiger",
        description: "Colorful, artistic painting of a tiger.",
        image: createIpfsFromCid("bafybeibc7mx5blw27wg4wsmtaosxzgkg2brvanv5yui3kgp2x5mqsmnvjy/tiger.jpg")
    }));
    const { tokenId: tokenId3 } = await mintNft(nftContractAnimals, signers[0], createJsonUriBase64({
        name: "Crane",
        description: "A simple drawing of a crane flying.",
        image: createIpfsFromCid("bafybeifjjsuv6qoor34trhp6whvahgnbsi5qipug5mjnzscxwnhapyleo4/crane.jpg")
    }));
    await putNftForSale(nftContractAnimals, signers[0], tokenId1, 2);
    await putNftForSale(nftContractAnimals, signers[0], tokenId2, 3);
    await putNftForSale(nftContractAnimals, signers[0], tokenId3, 5);
    await buyNftForSale(nftContractAnimals, signers[1], tokenId2, 3);

    const nftContractCity = await createNftContract(marketplaceContract, signers[0], "City", "CTY", "A collection of photographs of cities.");
    const { tokenId: tokenId4 } = await mintNft(nftContractCity, signers[0], createJsonUriBase64({
        name: "Alleyway",
        description: "An image of an alley.",
        image: createIpfsFromCid("bafybeicxyqndalvcptx7e5kreuxiay4wxsvso4qbrm5lqmjzl6iriyeahe/city-1.jpg")
    }));
    const { tokenId: tokenId5 } = await mintNft(nftContractCity, signers[0], createJsonUriBase64({
        name: "Roadside",
        description: "A vintage image of an urban roadside; a car is parked in view.",
        image: createIpfsFromCid("bafybeifjhv3nn3uidzanjdlfta4wmyzm5jtx2od4emas3ix6dpmti2skh4/city-2.jpg")
    }));
    const { tokenId: tokenId6 } = await mintNft(nftContractCity, signers[0], createJsonUriBase64({
        name: "Busy man",
        description: "A image of a man with a suitcase, walking in hurry.",
        image: createIpfsFromCid("bafybeicvsc73ftp5isjrm6rxknpsta5bu7pm6m3fdrqfilo6rzwdkzsshq/city-3.jpg")
    }));
    await putNftForSale(nftContractCity, signers[0], tokenId4, 2);
    await putNftForSale(nftContractCity, signers[0], tokenId5, 3);
    await putNftForSale(nftContractCity, signers[0], tokenId6, 5);
    await buyNftForSale(nftContractCity, signers[1], tokenId4, 2);

    const nftContractScene = await createNftContract(marketplaceContract, signers[1], "Scenery", "SCN", "A collection of paintings of sceneries.");
    const { tokenId: tokenId7 } = await mintNft(nftContractScene, signers[1], createJsonUriBase64({
        name: "Waterfall",
        description: "A painting of a forest with a waterfall flowing over a cliff.",
        image: createIpfsFromCid("bafybeiasjlieyuh37eop5cmv6fwqjskor7lteufryn4urxxzzxdvl2l2ni/scene-1.jpg")
    }));
    const { tokenId: tokenId8 } = await mintNft(nftContractScene, signers[1], createJsonUriBase64({
        name: "Hill",
        description: "A painting of a hilly grassland, with a mountain in the distance. There's a waterfall between these.",
        image: createIpfsFromCid("bafybeiba7jy3bu7zcghc3yvrdvckiarnafnsscmkqkdwj77wolgeayj4ty/scene-2.jpg")
    }));
    const { tokenId: tokenId9 } = await mintNft(nftContractScene, signers[1], createJsonUriBase64({
        name: "River",
        description: "A painting of a river flowing beside a mountain range.",
        image: createIpfsFromCid("bafybeiajenmsnfuuhxfbrvw7kcasdvjzj6n7txbull45tnruhh3obu2kv4/scene-3.jpg")
    }));
    await putNftForSale(nftContractScene, signers[1], tokenId7, 2);
    await putNftForSale(nftContractScene, signers[1], tokenId8, 3);
    await putNftForSale(nftContractScene, signers[1], tokenId9, 5);
    await buyNftForSale(nftContractScene, signers[0], tokenId8, 3);
}

// MAIN FUNC
const main = async () => {
    try {
        console.log("RESETTING ETHERNAL WORKSPACE...");
        await ethernal.resetWorkspace("Hardhat Matic");

        await deployAllContracts();
        await fillWoofyWithDummyData();
        await fillMarketplaceWithDummyData();

        console.log("\n\nALL READY!");
        process.exit(0);
    } catch (e) {
        console.log("ENCOUNTERED ERROR WHILE DEPLOYING!");
        console.log(e);
        process.exit(1);
    }
}

// Start main
main();
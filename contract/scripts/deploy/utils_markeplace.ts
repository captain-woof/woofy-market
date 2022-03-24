import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers } from "hardhat";
import { Marketplace, NFT } from "../../typechain-types";
import { NftContractCreatedEvent } from "../../typechain-types/Marketplace";
import { NftBoughtEvent, NftMintedEvent, NftOnSaleEvent, NftSaleCancelEvent } from "../../typechain-types/NFT";

export async function createNftContract(marketplaceContract: Marketplace, signer: Signer, name: string, symbol: string, description: string) {
    const txn = await marketplaceContract.connect(signer).createNftContract(name, symbol, description);
    const rcpt = await txn.wait();
    const event: NftContractCreatedEvent = rcpt.events?.find((event) => event.event === "NftContractCreated") as NftContractCreatedEvent;
    const nftContractCloneAddr = event.args.contractAddr;
    const nftContractCloneFactory = await ethers.getContractFactory("NFT");
    return nftContractCloneFactory.attach(nftContractCloneAddr);
}

export async function mintNft(nftContract: NFT, signer: Signer, metadataUri: string) {
    const txn = await nftContract.connect(signer).mintNft(metadataUri);
    const rcpt = await txn.wait();
    const event: NftMintedEvent = rcpt.events?.find((event) => event.event === "NftMinted") as NftMintedEvent;
    return event.args;
}

export async function putNftForSale(nftContract: NFT, signer: Signer, tokenId: BigNumberish, priceInMatic: string | number) {
    const txn = await nftContract.connect(signer).putNftForSale(tokenId, ethers.utils.parseEther(priceInMatic.toString()));
    const rcpt = await txn.wait();
    const event = rcpt.events?.find(({ event }) => event === "NftOnSale") as NftOnSaleEvent;
    return event.args;
}

export async function cancelNftForSale(nftContract: NFT, signer: Signer, tokenId: BigNumberish) {
    const txn = await nftContract.connect(signer).cancelNftForSale(tokenId);
    const rcpt = await txn.wait();
    const event = rcpt.events?.find(({ event }) => event === "NftSaleCancel") as NftSaleCancelEvent;
    return event.args;
}

export async function buyNftForSale(nftContract: NFT, signer: Signer, tokenId: BigNumberish, priceInMatic: string | number) {
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

export function createJsonUriBase64(obj: Object) {
    const data = Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
    return "data:application/json;base64," + data;
}

export function createIpfsFromCid(cid: string){
    return `https://ipfs.io/ipfs/${cid}`;
}
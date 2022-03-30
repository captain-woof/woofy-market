import { BigNumber } from "ethers";
import { Marketplace } from "../typechain-types";
import { MetadataObj, Nft } from "../types/nft";
import { isStringsEqualCaseInsensitive } from "./string";

// Function to structurise a single NFT collection
export const structureIntoNftColl = (nftsInCollection: Array<Marketplace.NftStructOutput>): Array<Marketplace.NftStruct> => nftsInCollection.map(({ tokenId, metadataUri, owner, price }) => ({
    tokenId: tokenId.toString(),
    metadataUri,
    owner,
    price: price.toString()
}));

// Function to structurise NFT collections array
export const structureIntoNftColls = (nftCollsUnstructured: Marketplace.NftCollectionStructOutput[]): Array<Marketplace.NftCollectionStruct> => nftCollsUnstructured.map(({ author, description, name, symbol, nftsInCollection, nftContractAddr }) => ({
    name,
    symbol,
    description,
    author,
    nftContractAddr,
    nftsInCollection: structureIntoNftColl(nftsInCollection)
}));

// Function to get metadata json from base64 encoded form
export const decodeMetadataUri = (metadataUriB64String: string): MetadataObj => {
    const b64 = metadataUriB64String.slice(29);
    const obj = JSON.parse(Buffer.from(b64, "base64").toString()) as MetadataObj;
    return obj;
}

// Function to get NFT status
export enum NftStatus {
    OWN_FOR_SALE,
    OWN_NOT_FOR_SALE,
    NOT_OWN_FOR_SALE,
    NOT_OWN_NOT_FOR_SALE
}
export const getNftStatus = (signerAddr: string, nft: Nft) => {
    const price = BigNumber.from(nft.tokenPrice);
    const isOwner = isStringsEqualCaseInsensitive(signerAddr, nft.tokenOwner);

    return (isOwner ? (price.eq(0) ? NftStatus.OWN_NOT_FOR_SALE : NftStatus.OWN_FOR_SALE) : (price.eq(0) ? NftStatus.NOT_OWN_NOT_FOR_SALE : NftStatus.NOT_OWN_FOR_SALE))
}

// Function to return IPFS file uri
export const getIpfsFileUri = (ipfsUri: string) => (
    !ipfsUri.startsWith("ipfs://") ? ipfsUri : `https://ipfs.io/ipfs/${ipfsUri.split("ipfs://")[1]}`
)
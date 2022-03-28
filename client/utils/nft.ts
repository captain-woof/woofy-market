import { Marketplace } from "../typechain-types";
import { MetadataObj } from "../types/nft";

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
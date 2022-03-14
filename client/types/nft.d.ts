import { BigNumber } from "ethers";

export interface NFT {
    tokenId: BigNumber;
    name: string;
    description: string;
    attributes: Array<{
        trait_type: string;
        value: number;
        display_type: string;
    }>;
    image: string;
}
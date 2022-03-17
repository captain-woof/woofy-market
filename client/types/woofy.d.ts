import { BigNumber } from "ethers";

export enum NFT_STATUS {
    FOR_SALE,
    NOT_FOR_SALE
}

export interface Woofy {
    tokenId: BigNumber;
    name: string;
    description: string;
    attributes: Array<{
        trait_type: string;
        value: number;
        display_type: string;
    }>;
    image: string;
    price: BigNumber;
    owner: string;
    status: NFT_STATUS;
}
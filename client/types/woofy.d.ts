import { BigNumber } from "ethers";
import { NFT_STATUS } from "../enums/woofy_sale_status";

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
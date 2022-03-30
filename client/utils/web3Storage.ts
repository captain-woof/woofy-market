import { CIDString, Web3Storage, File } from "web3.storage";

const client = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3_STORAGE_API as string });

export const putFileWeb3 = async (fileContent: string | Blob, fileName: string, type: string): Promise<CIDString> => {
    const file = new File([fileContent], fileName, { type });
    const cid = await client.put([file]);
    return cid;
}
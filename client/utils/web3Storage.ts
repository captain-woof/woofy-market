import { CIDString, Web3Storage, File } from "web3.storage";

const client = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3_STORAGE_API as string });

export const putFileWeb3 = async (fileContent: string, fileName: string): Promise<CIDString> => {
    const file = new File([fileContent], fileName, { type: "text/plain" });
    const cid = await client.put([file]);
    return cid;
}
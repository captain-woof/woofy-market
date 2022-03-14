import { NextApiHandler } from "next";
import fs from "fs";
import { putFileWeb3 } from "../../utils/web3Storage";

// /api/createNftImage?tokenId=N -> Returns CID in {message}
const handler: NextApiHandler = async (req, res) => {
    try {
        const tokenId = req.query["tokenId"];
        if (isNaN(parseInt(tokenId as string))) throw new Error("INVALID TOKEN ID");
        const nftImageContents = fs.readFileSync("public/nft-image.svg");
        const nftBaseImage = nftImageContents.toString("utf-8");
        const nftImage = nftBaseImage.replace("# NUMBER", `#${tokenId}`);
        const cid = await putFileWeb3(nftImage, `WOOFY-${tokenId}.svg`);
        res.status(200).json({ status: "SUCCESS", message: `${cid}/WOOFY-${tokenId}.svg` });
    } catch (e) {
        console.log("ERROR WHILE CREATING NFT IMAGE", e);
        res.status(500).json({ status: "ERROR", message: e });
    }
}

export default handler;
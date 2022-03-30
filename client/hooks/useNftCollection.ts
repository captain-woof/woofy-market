import { BigNumber, BigNumberish, Contract, ethers } from "ethers";
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { NFT } from "../typechain-types";
import { NftCollection } from "../types/nft";
import NftContractInterface from "../contracts/NFT.json";
import { useWallet } from "./useWallet";
import { dev } from "../utils/log";
import { useToast } from "@chakra-ui/react";
import { putFileWeb3 } from "../utils/web3Storage";
import { slugify } from "../utils/string";
import { NftMintedEvent } from "../typechain-types/NFT";
import { decodeMetadataUri } from "../utils/nft";

export const useNftCollection = (initialValue: NftCollection, setPutNftForSaleDialogVisible: Dispatch<SetStateAction<boolean>>) => {
    const toast = useToast();
    const { signer, signerAddr } = useWallet();
    const [nftCollection, setNftCollection] = useState<NftCollection>(initialValue);
    const nftCollectionContract = useMemo(() => (
        !!signer ? new Contract(initialValue.nftContractAddr, NftContractInterface.abi, signer) as NFT : null
    ), [signer, initialValue]);
    const [progressMint, setProgressMint] = useState<boolean>(false);
    const [progressBuy, setProgressBuy] = useState<boolean>(false);
    const [progressSale, setProgressSale] = useState<boolean>(false);
    const [progressCancel, setProgressCancel] = useState<boolean>(false);

    // Function to mint new NFT
    const mintNft = useCallback(async (name: string, description: string, image: Blob) => {
        if (!!nftCollectionContract) {

            try {
                setProgressMint(true);
                const filename = `${slugify(name)}.${image.type.split("/")[1]}`;
                const cid = await putFileWeb3(image, filename, image.type);

                const metadataJson = {
                    name,
                    description,
                    image: `ipfs://${cid}/${filename}`
                }
                const metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadataJson), "utf-8").toString("base64")}`;

                const txn = await nftCollectionContract.mintNft(metadataUri);
                const rcpt = await txn.wait();
                const { args: { tokenId, tokenUri, mintedTo } }: NftMintedEvent = rcpt.events?.find((e) => e.event === "NftMinted") as NftMintedEvent;

                setNftCollection((prev) => {
                    if (!!prev.nftsInCollection.find((nft) => BigNumber.from(nft.tokenId).eq(tokenId))) {
                        return prev;
                    } else {
                        const newNftCollection = { ...prev };
                        newNftCollection.nftsInCollection.push({
                            tokenId,
                            tokenUri: decodeMetadataUri(tokenUri),
                            tokenOwner: mintedTo,
                            tokenPrice: "0"
                        })
                        return newNftCollection;
                    }
                });

                toast({
                    title: "SUCCESSFULLY MINTED NEW NFT!",
                    description: "Your new NFT has been minted and added to this collection.",
                    status: "success"
                });

            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR WHILE MINTING!",
                    description: "Your new NFT could not be minted. Please try again.",
                    status: "error"
                });
            } finally {
                setProgressMint(false);
            }
        }
    }, [nftCollectionContract, toast])

    // Function to buy NFT
    const buyNft = useCallback(async (tokenId: BigNumberish) => {
        if (!!nftCollectionContract) {
            let nftToBuyIndex: number;
            const nftToBuy = nftCollection.nftsInCollection.find((nft, i) => {
                if (BigNumber.from(tokenId).eq(nft.tokenId)) {
                    nftToBuyIndex = i;
                    return true;
                }
            });
            if (!!nftToBuy) {
                try {
                    setProgressBuy(true);
                    await nftCollectionContract.buyNftForSale(nftToBuy.tokenId, { value: nftToBuy.tokenPrice });
                    toast({
                        title: "PURCHASE SUCCESSFUL!",
                        description: "Your purchase was successfully processed.",
                        status: "success"
                    });
                    setNftCollection((prev) => {
                        const newNftCollection = { ...prev };
                        newNftCollection.nftsInCollection[nftToBuyIndex].tokenPrice = "0";
                        newNftCollection.nftsInCollection[nftToBuyIndex].tokenOwner = signerAddr;
                        return newNftCollection;
                    });
                } catch (e) {
                    dev.error(e);
                    toast({
                        title: "PURCHASE FAILED!",
                        description: "Your purchase could not processed. Please try again.",
                        status: "error"
                    });
                } finally {
                    setProgressBuy(false);
                }
            }
        }
    }, [nftCollection, nftCollectionContract, toast, signerAddr])

    // Function to buy NFT
    const putForSaleNft = useCallback(async (tokenId: BigNumberish, priceInMatic: string | number) => {
        if (!!nftCollectionContract) {
            let nftToPutForSaleIndex: number;
            const nftToPutForSale = nftCollection.nftsInCollection.find((nft, i) => {
                if (BigNumber.from(tokenId).eq(nft.tokenId)) {
                    nftToPutForSaleIndex = i;
                    return true;
                }
            });
            if (!!nftToPutForSale) {
                try {
                    setProgressSale(true);
                    await nftCollectionContract.putNftForSale(nftToPutForSale.tokenId, ethers.utils.parseEther(priceInMatic.toString()));
                    toast({
                        title: "PUT ON SALE!",
                        description: "Your NFT is now on sale, and is available to buyers.",
                        status: "success"
                    });
                    setNftCollection((prev) => {
                        const newNftCollection = { ...prev };
                        newNftCollection.nftsInCollection[nftToPutForSaleIndex].tokenPrice = ethers.utils.parseEther(priceInMatic.toString());
                        return newNftCollection;
                    });
                    setPutNftForSaleDialogVisible(false);
                } catch (e) {
                    dev.error(e);
                    toast({
                        title: "FAILED!",
                        description: "Failed to put this NFT on sale. Please try again.",
                        status: "error"
                    });
                } finally {
                    setProgressSale(false);
                }
            }
        }
    }, [nftCollection, nftCollectionContract, toast, setPutNftForSaleDialogVisible])

    // Function to cancel an NFT on sale
    const cancelSaleNft = useCallback(async (tokenId: BigNumberish) => {
        if (!!nftCollectionContract) {
            let nftToCancelSaleIndex: number;
            const nftToCancelSale = nftCollection.nftsInCollection.find((nft, i) => {
                if (BigNumber.from(tokenId).eq(nft.tokenId)) {
                    nftToCancelSaleIndex = i;
                    return true;
                }
            });
            if (!!nftToCancelSale) {
                try {
                    setProgressCancel(true);
                    await nftCollectionContract.cancelNftForSale(nftToCancelSale.tokenId);
                    toast({
                        title: "SALE CANCELLED!",
                        description: "Your NFT is no longer on sale now.",
                        status: "success"
                    });
                    setNftCollection((prev) => {
                        const newNftCollection = { ...prev };
                        newNftCollection.nftsInCollection[nftToCancelSaleIndex].tokenPrice = "0";
                        return newNftCollection;
                    });
                } catch (e) {
                    dev.error(e);
                    toast({
                        title: "FAILED!",
                        description: "Failed to cancel this NFT from sale. Please try again.",
                        status: "error"
                    });
                } finally {
                    setProgressCancel(false);
                }
            }
        }
    }, [nftCollection, nftCollectionContract, toast])

    return ({
        nftCollection,
        buyNft,
        progressBuy,
        putForSaleNft,
        progressSale,
        progressCancel,
        cancelSaleNft,
        progressMint,
        mintNft
    })
}
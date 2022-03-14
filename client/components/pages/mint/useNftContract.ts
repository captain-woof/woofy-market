import { useWallet } from "../../../hooks/useWallet"
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { dev } from "../../../utils/log";
import { BigNumber, ethers } from "ethers";
import { NFT } from "../../../types/nft";

export const useNftContract = () => {
    const { nftContractConnToSigner, isConnected, nftContract, signerAddr } = useWallet();
    const toast = useToast();
    const [numOfNftsOwned, setNumOfNftsOwned] = useState<BigNumber>(BigNumber.from(0));
    const [nftsOwned, setNftsOwned] = useState<Array<NFT>>([]);
    const [progressMint, setProgressMint] = useState<boolean>(false);
    const [progressFetchNfts, setProgressFetchNfts] = useState<boolean>(false);

    // SET NUM OF NFTs OWNED
    useEffect(() => {
        (async () => {
            if (!!nftContract && !!signerAddr && signerAddr !== "") {
                const newNftsOwned = await nftContract.balanceOf(signerAddr);
                setNumOfNftsOwned(newNftsOwned);
            }
        })()
    }, [nftContract, signerAddr])

    // KEEP ARRAY OF NFTs OWNED UPDATED
    useEffect(() => {
        (async () => {
            if (!!nftContractConnToSigner) {
                try {
                    setProgressFetchNfts(true);
                    const newNftsOwnedSerialized: Array<{ tokenID: BigNumber, tokenURI: string }> = await nftContractConnToSigner.getAllNftsOwned();
                    const newNftsOwned = newNftsOwnedSerialized.map((nftOwned) => ({
                        tokenId: nftOwned.tokenID,
                        ...(JSON.parse((Buffer.from(nftOwned.tokenURI.split("base64,")[1], "base64")).toString()))
                    })) as Array<NFT>;
                    setNftsOwned(newNftsOwned);
                } catch (e) {
                    dev.error(e);
                    toast({
                        title: "ERROR",
                        description: "Could not fetch your NFTs! Please try again later.",
                        status: "error"
                    })
                } finally {
                    setProgressFetchNfts(false);
                }
            }
        })()
    }, [numOfNftsOwned, nftContractConnToSigner, toast])

    const mint = useCallback(async () => {
        if (isConnected && !!nftContractConnToSigner) {
            try {
                setProgressMint(true);
                const txnCreateNft = await nftContractConnToSigner.createNFT({ value: ethers.utils.parseEther("0.001") });
                await txnCreateNft.wait();
                const tokenId = await nftContractConnToSigner.getNewTokenId();
                const { data, status } = await axios.get(`/api/createNftImage`, {
                    params: {
                        tokenId: tokenId.toString()
                    },
                    responseType: "json"
                })
                if (status !== 200) {
                    throw new Error("Error while creating NFT image on server");
                } else {
                    const cid = data.message;
                    const txnSetNewTokenURI = await nftContractConnToSigner.setNewTokenURI(`ipfs://${cid}`);
                    await txnSetNewTokenURI.wait();
                    setNumOfNftsOwned((prev) => BigNumber.from(prev.add(1)));
                    toast({
                        title: "MINTED",
                        description: "You have successfully minted a WOOFY NFT!",
                        status: "success"
                    })
                }
            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR",
                    description: "An unexpected error occured while trying to purchase!",
                    status: "error"
                })
            } finally {
                setProgressMint(false);
            }
        } else {
            toast({
                title: "WALLET NOT CONNECTED",
                description: "You need to connect your wallet first before purchasing!",
                status: "error"
            })
        }
    }, [nftContractConnToSigner, isConnected, toast])

    return {
        mint,
        progressMint,
        numOfNftsOwned,
        nftsOwned,
        progressFetchNfts
    }
}
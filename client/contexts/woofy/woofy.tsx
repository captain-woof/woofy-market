import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react"
import { useWallet } from "../../hooks/useWallet";
import { Woofy } from "../../types/woofy";
import { dev } from "../../utils/log";


interface WoofyContext {
    mintWoofy: () => Promise<void>,
    progressMintWoofy: boolean,
    numOfWoofysOwned: BigNumber,
    woofysOwned: Array<Woofy>,
    progressFetchWoofys: boolean,
    maxWoofysNum: BigNumber,
    woofyMintedsNum: BigNumber
}

export const WoofyContext = createContext<WoofyContext>({
    mintWoofy: async () => { },
    progressMintWoofy: false,
    numOfWoofysOwned: BigNumber.from(0),
    woofysOwned: [],
    progressFetchWoofys: false,
    maxWoofysNum: BigNumber.from(0),
    woofyMintedsNum: BigNumber.from(0)
});

export const WoofyProvider = ({ children }: { children: ReactNode }) => {
    const { woofyContractConnToSigner, isConnected, woofyContract, signerAddr } = useWallet();
    const toast = useToast();
    const [maxWoofysNum, setMaxWoofysNum] = useState<BigNumber>(BigNumber.from(0));
    const [woofyMintedsNum, setWoofysMintedNum] = useState<BigNumber>(BigNumber.from(0));
    const [numOfWoofysOwned, setNumOfWoofysOwned] = useState<BigNumber>(BigNumber.from(0));
    const [woofysOwned, setWoofysOwned] = useState<Array<Woofy>>([]);
    const [progressMintWoofy, setProgressMintWoofy] = useState<boolean>(false);
    const [progressFetchWoofys, setProgressFetchWoofys] = useState<boolean>(false);

    // SET NUM OF WOOFYs OWNED AND NUM OF WOOFYs IN CIRCULATION AND MAX
    useEffect(() => {
        (async () => {
            if (!!woofyContract && !!signerAddr && signerAddr !== "") {
                const newNumOfWoofysOwned = await woofyContract.balanceOf(signerAddr);
                setNumOfWoofysOwned(newNumOfWoofysOwned);

                const newMaxWoofysNum = await woofyContract.MAX_SUPPLY();
                setMaxWoofysNum(newMaxWoofysNum);

                const newMaxWoofysMintedNum = await woofyContract.totalSupply();
                setWoofysMintedNum(newMaxWoofysMintedNum);
            }
        })()
    }, [woofyContract, signerAddr])

    // KEEP ARRAY OF WOOFYs OWNED UPDATED
    useEffect(() => {
        (async () => {
            if (!!woofyContractConnToSigner) {
                try {
                    setProgressFetchWoofys(true);
                    const newWoofysOwnedSerialized: Array<{ tokenID: BigNumber, tokenURI: string, price: BigNumber, owner: string, status: any }> = await woofyContractConnToSigner.getAllNftsOwned();
                    const newWoofysOwned: Array<Woofy> = newWoofysOwnedSerialized.map((nftOwned) => ({
                        tokenId: nftOwned.tokenID,
                        owner: nftOwned.owner,
                        price: nftOwned.price,
                        status: nftOwned.status,
                        ...(JSON.parse((Buffer.from(nftOwned.tokenURI.split("base64,")[1], "base64")).toString()))
                    }));
                    setWoofysOwned(newWoofysOwned);
                } catch (e) {
                    dev.error(e);
                    toast({
                        title: "ERROR",
                        description: "Could not fetch your WOOFYs! Please try again later.",
                        status: "error"
                    })
                } finally {
                    setProgressFetchWoofys(false);
                }
            }
        })()
    }, [numOfWoofysOwned, woofyContractConnToSigner, toast])

    const mintWoofy = useCallback(async () => {
        if (isConnected && !!woofyContractConnToSigner) {
            try {
                setProgressMintWoofy(true);
                const txnCreateWoofy = await woofyContractConnToSigner.createNFT({ value: ethers.utils.parseEther("0.1") });
                await txnCreateWoofy.wait();
                const tokenId = await woofyContractConnToSigner.getNewTokenId();
                const { data, status } = await axios.get(`/api/createWoofyImage`, {
                    params: {
                        tokenId: tokenId.toString()
                    },
                    responseType: "json"
                })
                if (status !== 200) {
                    throw new Error("Error while creating WOOFY image on server");
                } else {
                    const cid = data.message;
                    const txnSetNewTokenURI = await woofyContractConnToSigner.setNewTokenURI(`ipfs://${cid}`);
                    await txnSetNewTokenURI.wait();
                    setNumOfWoofysOwned((prev) => BigNumber.from(prev.add(1)));
                    setWoofysMintedNum((prev) => BigNumber.from(prev.add(1)));
                    toast({
                        title: "MINTED",
                        description: "You have successfully minted a WOOFY!",
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
                setProgressMintWoofy(false);
            }
        } else {
            toast({
                title: "WALLET NOT CONNECTED",
                description: "You need to connect your wallet first before purchasing!",
                status: "error"
            })
        }
    }, [woofyContractConnToSigner, isConnected, toast])

    return (
        <WoofyContext.Provider value={{
            mintWoofy,
            progressMintWoofy,
            numOfWoofysOwned,
            woofysOwned,
            progressFetchWoofys,
            maxWoofysNum,
            woofyMintedsNum
        }}>
            {children}
        </WoofyContext.Provider>
    )
}
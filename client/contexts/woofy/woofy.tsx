import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react"
import { NFT_STATUS } from "../../enums/woofy_sale_status";
import { useWallet } from "../../hooks/useWallet";
import { Woofy } from "../../types/woofy";
import { dev } from "../../utils/log";
import { isStringsEqualCaseInsensitive } from "../../utils/string";

interface WoofyContext {
    mintWoofy: () => Promise<void>,
    progressMintWoofy: boolean,
    numOfWoofysOwned: BigNumber,
    woofysOwned: Array<Woofy>,
    progressFetchWoofys: boolean,
    maxWoofysNum: BigNumber,
    woofyMintedsNum: BigNumber
    progressSell: boolean,
    putForSale: (tokenId: BigNumber, priceMatic: number | string) => Promise<void>,
    cancelSale: (tokenId: BigNumber) => Promise<void>,
    progressCancel: boolean,
    woofysForSaleByOthers: Array<Woofy>,
    progressGetAllWoofysForSaleByOthers: boolean,
    setAllWoofysForSaleByOthers: () => Promise<void>,
    progressBuy: boolean,
    buyWoofyForSale: (woofy: Woofy) => Promise<void>
}

export const WoofyContext = createContext<WoofyContext>({
    mintWoofy: async () => { },
    progressMintWoofy: false,
    numOfWoofysOwned: BigNumber.from(0),
    woofysOwned: [],
    progressFetchWoofys: false,
    maxWoofysNum: BigNumber.from(0),
    woofyMintedsNum: BigNumber.from(0),
    progressSell: false,
    putForSale: async (tokenId, priceMatic) => { },
    cancelSale: async (tokenId) => { },
    progressCancel: false,
    woofysForSaleByOthers: [],
    progressGetAllWoofysForSaleByOthers: true,
    setAllWoofysForSaleByOthers: async () => { },
    progressBuy: false,
    buyWoofyForSale: async () => { }
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
    const [progressSell, setProgressSell] = useState<boolean>(false);
    const [progressCancel, setProgressCancel] = useState<boolean>(false);
    const [woofysForSaleByOthers, setWoofysForSaleByOthers] = useState<Array<Woofy>>([]);
    const [progressGetAllWoofysForSaleByOthers, setProgressGetAllWoofysForSaleByOthers] = useState<boolean>(false);
    const [progressBuy, setProgressBuy] = useState<boolean>(false);

    // UPDATE LIST OF WOOFYs FOR SALE ON FIRST RENDER
    useEffect(() => {
        if (!!woofyContractConnToSigner) {
            setAllWoofysForSaleByOthers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [woofyContractConnToSigner])

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

    // Function to mint new WOOFY
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

    // Function to put WOOFY for sale
    const putForSale = useCallback(async (tokenId: BigNumber, priceMatic: number | string) => {
        if (!!woofyContractConnToSigner) {
            try {
                setProgressSell(true);
                const price = ethers.utils.parseEther(priceMatic.toString());
                const txn = await woofyContractConnToSigner.putForSale(tokenId, price);
                await txn.wait();
                setWoofysOwned((prevWoofysOwned) => (
                    prevWoofysOwned.map((prevWoofyOwned) => (
                        prevWoofyOwned.tokenId.eq(tokenId) ? { ...prevWoofyOwned, status: NFT_STATUS.FOR_SALE, price } : prevWoofyOwned
                    ))
                ));
                toast({
                    title: "ON SALE",
                    description: "Your WOOFY has been listed for sale now!",
                    status: "success"
                });
            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR",
                    description: "An unexpected error occured while trying to purchase!",
                    status: "error"
                })
            } finally {
                setProgressSell(false);
            }
        }
    }, [woofyContractConnToSigner, toast])

    // Function to cancel WOOFY sale
    const cancelSale = useCallback(async (tokenId: BigNumber) => {
        if (!!woofyContractConnToSigner) {
            try {
                setProgressCancel(true);
                const txn = await woofyContractConnToSigner.cancelSale(tokenId);
                await txn.wait();
                setWoofysOwned((prevWoofysOwned) => (
                    prevWoofysOwned.map((prevWoofyOwned) => (
                        prevWoofyOwned.tokenId.eq(tokenId) ? { ...prevWoofyOwned, status: NFT_STATUS.NOT_FOR_SALE } : prevWoofyOwned
                    ))
                ));
                toast({
                    title: "CANCELLED",
                    description: "Your WOOFY has been de-listed for sale.",
                    status: "success"
                });
            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR",
                    description: "An unexpected error occured while trying to cancel!",
                    status: "error"
                })
            } finally {
                setProgressCancel(false);
            }
        }
    }, [woofyContractConnToSigner, toast])

    // Function to cancel WOOFY sale
    const buyWoofyForSale = useCallback(async (woofy: Woofy) => {
        if (!!woofyContractConnToSigner) {
            try {
                setProgressBuy(true);
                const txn = await woofyContractConnToSigner.buy(woofy.tokenId, { value: woofy.price });
                await txn.wait();
                setWoofysForSaleByOthers((prevWoofysForSaleByOthers) => prevWoofysForSaleByOthers.filter((prevWoofyForSaleByOthers) => !prevWoofyForSaleByOthers.tokenId.eq(woofy.tokenId)));
                setWoofysOwned((prevWoofysOwned) => ([...prevWoofysOwned, { ...woofy, status: NFT_STATUS.NOT_FOR_SALE }]));
                toast({
                    title: "SUCCESSFULLY BOUGHT",
                    description: "This WOOFY is now yours!",
                    status: "success"
                });
            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR",
                    description: "An unexpected error occured while trying to purchase!",
                    status: "error"
                })
            } finally {
                setProgressBuy(false);
            }
        }
    }, [woofyContractConnToSigner, toast])

    // Function to cancel WOOFY sale
    const setAllWoofysForSaleByOthers = useCallback(async () => {
        if (!!woofyContractConnToSigner) {
            try {
                setProgressGetAllWoofysForSaleByOthers(true);
                const newWoofysForSaleSerialized: Array<{ tokenID: BigNumber, tokenURI: string, price: BigNumber, owner: string, status: any }> = await woofyContractConnToSigner.getAllNftsForSale();
                const newWoofysForSaleByOthers: Array<Woofy> = newWoofysForSaleSerialized
                    .filter((newWoofyForSale) => !isStringsEqualCaseInsensitive(newWoofyForSale.owner, signerAddr))
                    .map((newWoofyForSaleByOthers) => ({
                        tokenId: newWoofyForSaleByOthers.tokenID,
                        owner: newWoofyForSaleByOthers.owner,
                        price: newWoofyForSaleByOthers.price,
                        status: newWoofyForSaleByOthers.status,
                        ...(JSON.parse((Buffer.from(newWoofyForSaleByOthers.tokenURI.split("base64,")[1], "base64")).toString()))
                    }));
                setWoofysForSaleByOthers(newWoofysForSaleByOthers);
            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR",
                    description: "An unexpected error occured while trying to get listed WOOFYs!",
                    status: "error"
                })
            } finally {
                setProgressGetAllWoofysForSaleByOthers(false);
            }
        }
    }, [woofyContractConnToSigner, toast, signerAddr])

    return (
        <WoofyContext.Provider value={{
            mintWoofy,
            progressMintWoofy,
            numOfWoofysOwned,
            woofysOwned,
            progressFetchWoofys,
            maxWoofysNum,
            woofyMintedsNum,
            progressSell,
            putForSale,
            cancelSale,
            progressCancel,
            woofysForSaleByOthers,
            progressGetAllWoofysForSaleByOthers,
            setAllWoofysForSaleByOthers,
            progressBuy,
            buyWoofyForSale
        }}>
            {children}
        </WoofyContext.Provider>
    )
}
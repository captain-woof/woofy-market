import { Contract, ethers } from "ethers";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react"
import { useWallet } from "../../hooks/useWallet";
import { Marketplace, NFT } from "../../typechain-types";
import MarketplaceInterface from "../../contracts/Marketplace.json";
import NftImplInterface from "../../contracts/NFT.json";
import { NftContractCreatedEvent } from "../../typechain-types/Marketplace";
import { dev } from "../../utils/log";
import { useToast } from "@chakra-ui/react";

interface MarketplaceContext {
    marketplaceContract: Marketplace | null,
    marketplaceContractConn: Marketplace | null,
    allNftCollections: Marketplace.NftCollectionStructOutput[],
    allNftCollectionsWhereSignerOwnsTokens: Marketplace.NftCollectionStructOutput[],
    allNftCollectionsAuthored: Marketplace.NftCollectionStructOutput[],
    allNftCollectionsWhereTokenOnSale: Marketplace.NftCollectionStructOutput[],
    refreshLoadedData: () => Promise<void>,
    createNewNftCollection: (name: string, symbol: string, description: string) => Promise<NFT | null | undefined>;
    progressCreateNftCollection: boolean
}

export const MarketplaceContext = createContext<MarketplaceContext>({
    marketplaceContract: null,
    marketplaceContractConn: null,
    allNftCollections: [],
    allNftCollectionsWhereSignerOwnsTokens: [],
    allNftCollectionsAuthored: [],
    allNftCollectionsWhereTokenOnSale: [],
    refreshLoadedData: async () => { },
    createNewNftCollection: async () => null,
    progressCreateNftCollection: false
});

export default function MarketplaceProvider({ children }: { children: ReactNode }) {
    const { signer, provider } = useWallet();
    const [marketplaceContract, setMarketplaceContract] = useState<Marketplace | null>(null);
    const [marketplaceContractConn, setMarketplaceContractConn] = useState<Marketplace | null>(null);
    const [allNftCollections, setAllNftCollections] = useState<Marketplace.NftCollectionStructOutput[]>([]);
    const [allNftCollectionsWhereSignerOwnsTokens, setAllNftCollectionsWhereSignerOwnsTokens] = useState<Marketplace.NftCollectionStructOutput[]>([]);
    const [allNftCollectionsAuthored, setAllNftCollectionsAuthored] = useState<Marketplace.NftCollectionStructOutput[]>([]);
    const [allNftCollectionsWhereTokenOnSale, setAllNftCollectionsWhereTokenOnSale] = useState<Marketplace.NftCollectionStructOutput[]>([]);
    const [progressCreateNftCollection, setProgressCreateNftCollection] = useState<boolean>(false);
    const toast = useToast();

    // Keep contracts updated
    useEffect(() => {
        if (!!provider) {
            const newMarketplaceContract: Marketplace = new Contract(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS as string, MarketplaceInterface.abi, provider) as Marketplace;
            setMarketplaceContract(newMarketplaceContract);
        }
        if (!!signer) {
            const newMarketplaceContractConn: Marketplace = new Contract(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS as string, MarketplaceInterface.abi, signer) as Marketplace;
            setMarketplaceContractConn(newMarketplaceContractConn);
        } else {
            setMarketplaceContractConn(null);
        }
    }, [signer, provider])

    // Keep lists of NFT collections updated
    useEffect(() => {
        refreshLoadedData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketplaceContract, marketplaceContractConn])

    // Function to refresh loaded data
    const refreshLoadedData = useCallback(async () => {
        if (!!marketplaceContract) {
            const newAllNftCollections = await marketplaceContract.getAllNftCollections();
            setAllNftCollections(newAllNftCollections);
        }

        if (!!marketplaceContractConn) {
            const newAllNftCollectionsWhereSignerOwnsTokens = await marketplaceContractConn.getNftsCollectionsWhereOwnerOwnsTokens();
            setAllNftCollectionsWhereSignerOwnsTokens(newAllNftCollectionsWhereSignerOwnsTokens);

            const newAllNftCollectionsAuthored = await marketplaceContractConn.getNftsCollectionsAuthored();
            setAllNftCollectionsAuthored(newAllNftCollectionsAuthored);

            const newAllNftCollectionsWhereTokenOnSale = await marketplaceContractConn.getNftCollectionsWhereTokensOnSale();
            setAllNftCollectionsWhereTokenOnSale(newAllNftCollectionsWhereTokenOnSale);
        }
    }, [marketplaceContract, marketplaceContractConn])

    // Function to create new NFT collection
    const createNewNftCollection = useCallback(async (name: string, symbol: string, description: string) => {
        if (!!marketplaceContractConn && signer) {
            try {
                setProgressCreateNftCollection(true);
                const txn = await marketplaceContractConn.createNftContract(name, symbol, description);
                const rcpt = await txn.wait();
                const event: NftContractCreatedEvent = rcpt.events?.find((event) => event.event === "NftContractCreated") as NftContractCreatedEvent;
                const nftContractCloneAddr = event.args.contractAddr;
                const nftContractClone = new Contract(nftContractCloneAddr, NftImplInterface.abi, signer) as NFT;
                await refreshLoadedData();
                setProgressCreateNftCollection(false);
                toast({
                    title: "NFT COLLECTION CREATED!",
                    status: "success",
                    description: "Your new NFT collection has been created. Redirecting you now..."
                });
                return nftContractClone;
            } catch (e) {
                dev.error(e);
                toast({
                    title: "ERROR!",
                    status: "error",
                    description: "Your new NFT collection could not be created. Please try again"
                });
                setProgressCreateNftCollection(false);
            }
        } else {
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketplaceContractConn, signer, toast])

    return (
        <MarketplaceContext.Provider value={{
            marketplaceContract,
            marketplaceContractConn,
            allNftCollections,
            allNftCollectionsWhereSignerOwnsTokens,
            allNftCollectionsAuthored,
            allNftCollectionsWhereTokenOnSale,
            refreshLoadedData,
            createNewNftCollection,
            progressCreateNftCollection
        }}>
            {children}
        </MarketplaceContext.Provider>
    )
}
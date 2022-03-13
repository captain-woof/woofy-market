import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import { ethers, Signer } from "ethers";
import { useToast } from "@chakra-ui/react";
import NFTContractInterface from "../../contracts/Woofy.json";
import { dev } from "../../utils/log";

export const WalletContext = createContext<WalletContext>({
    provider: null,
    nftContract: null,
    nftContractConnToSigner: null,
    signer: null,
    signerAddr: "",
    progress: false,
    error: false,
    setup: async () => { }
});

export interface WalletContext {
    provider: ethers.providers.Web3Provider | null
    nftContract: ethers.Contract | null
    nftContractConnToSigner: ethers.Contract | null
    signer: ethers.Signer | null
    signerAddr: string
    progress: boolean
    error: boolean
    setup: () => Promise<void>
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    // TOASTS
    const toast = useToast();

    // WEB3
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [nftContract, setNftContract] = useState<ethers.Contract | null>(null);
    const [nftContractConnToSigner, setNftContractConnToSigner] = useState<ethers.Contract | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [signerAddr, setSignerAddr] = useState<string>("");
    const [progress, setProgress] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    // Function to start setup
    const setup = useCallback(async () => {
        if (!("ethereum" in window && !!window.ethereum.request)) {
            toast({
                title: "METAMASK NOT FOUND",
                description: "Please install the Metamask extension to continue.",
                status: "error"
            })
        } else {
            try {
                setProgress(true);
                setError(false);
                const [newSignerAddr] = await window.ethereum.request({ method: "eth_requestAccounts" }) as Array<string>;
                setSignerAddr(newSignerAddr);

                const newProvider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(newProvider);

                const newSigner = newProvider.getSigner();
                setSigner(newSigner);

            } catch (e) {
                setError(true);
                setProgress(false);
                console.error("ERROR WHILE SETTING UP PROVIDER AND SIGNER", e);
            }
        }
    }, [toast])

    // Setup provider and signer update listener, and also start connection IF wallet is already connected
    useEffect(() => {
        (async () => {
            const [newSignerAddr] = await window.ethereum.request({ method: "eth_accounts" }) as Array<string>;
            if (!!newSignerAddr && newSignerAddr !== "") { // If wallet is pre-connected
                await setup();
                dev.log("PRE CONNECTED SETUP DONE!");
            }
        })()

        async function handleAccountChange() {
            const [newSignerAddr] = await window.ethereum.request({ method: "eth_accounts" }) as Array<string>;
            if (!newSignerAddr) { // If wallet is disconnected manually
                setNftContract(null);
                setNftContractConnToSigner(null);
                setSigner(null);
                setSignerAddr("");
            } else { // If another account was chosen
                await setup();
            }
        }

        window.ethereum.on("accountsChanged", handleAccountChange);
        return () => { window.ethereum.removeListener("accountsChanged", handleAccountChange) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Setup NFT contract when provider and signer have been setup
    useEffect(() => {
        (async () => {
            if (!!provider && !!signer) {
                try {
                    const newNftContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string, NFTContractInterface.abi, provider as ethers.providers.Provider);
                    setNftContract(newNftContract);

                    const newNftConnToSigner = newNftContract.connect(signer as Signer);
                    setNftContractConnToSigner(newNftConnToSigner);
                } catch (e) {
                    setError(true);
                    console.error("ERROR WHILE SETTING UP NFT CONTRACT CONNECTIONS", e);
                } finally {
                    setProgress(false);
                }
            }
        })()
    }, [provider, signer])

    return (
        <WalletContext.Provider value={{
            provider,
            nftContract,
            nftContractConnToSigner,
            signer,
            signerAddr,
            progress,
            error,
            setup
        }}>
            {children}
        </WalletContext.Provider>
    )
}
import { ethers } from "ethers";
import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
    interface Window {
        ethereum: MetaMaskInpageProvider & ethers.providers.ExternalProvider
    }
}
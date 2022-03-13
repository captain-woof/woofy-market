import { useContext } from "react"
import Wallet from "../contexts/wallet"

export const useWallet = () => useContext(Wallet.WalletContext);
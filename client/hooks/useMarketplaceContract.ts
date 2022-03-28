import { useContext } from "react";
import Marketplace from "../contexts/marketplace";

export const useMarketplaceContract = () => {
    return useContext(Marketplace.MarketplaceContext);
}
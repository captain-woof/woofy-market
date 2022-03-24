import { useContext } from "react";
import Woofy from "../contexts/woofy";

export const useWoofyContract = () => {
    return useContext(Woofy.WoofyContext);
}
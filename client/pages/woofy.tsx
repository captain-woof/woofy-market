import { NextPage } from "next";
import Woofy from "../components/pages/woofy";
import Head from "next/head";

const WoofyPage: NextPage = () => {
    return (
        <>
            <Head>
                <title>WOOFY</title>
            </Head>
            <Woofy />
        </>
    )
}

export default WoofyPage;
import { NextPage } from "next";
import Woofy from "../components/pages/woofy";
import Head from "next/head";

const WoofyPage: NextPage = () => {
    return (
        <>
            <Head>
                <title>WOOFY</title>
                <meta property='og:title' content='WOOFY' />
                <meta name='twitter:title' content='WOOFY' />
                <meta name='description' content='Mint, buy, sell WOOFY tokens, and enjoy reduced marketplace commission rates for every NFT sale you make.' />
                <meta property='og:description' content='Mint, buy, sell WOOFY tokens, and enjoy reduced marketplace commission rates for every NFT sale you make.' />
                <meta name='twitter:description' content='Mint, buy, sell WOOFY tokens, and enjoy reduced marketplace commission rates for every NFT sale you make.' />
            </Head>
            <Woofy />
        </>
    )
}

export default WoofyPage;
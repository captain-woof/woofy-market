import Create from "../components/pages/create";
import Head from "next/head";

export default function CreatePage() {
    return (
        <>
            <Head>
                <title>Create new NFT collection</title>
                <meta property='og:title' content='Create new NFT collection' />
                <meta name='twitter:title' content='Create new NFT collection' />
                <meta name='description' content='Create your NFT collection and mint new NFTs!' />
                <meta property='og:description' content='Create your NFT collection and mint new NFTs!' />
                <meta name='twitter:description' content='Create your NFT collection and mint new NFTs!' />
            </Head>
            <Create />
        </>
    )
}
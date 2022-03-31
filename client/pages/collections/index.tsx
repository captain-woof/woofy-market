import Collections from "../../components/pages/collections";
import Head from "next/head";

export default function CollectionsPage() {
    return (
        <>
            <Head>
                <title>NFT Collections</title>
                <meta property='og:title' content='NFT Collections' />
                <meta name='twitter:title' content='NFT Collections' />
                <meta name='description' content='Find NFT collections that interest you.' />
                <meta property='og:description' content='Find NFT collections that interest you.' />
                <meta name='twitter:description' content='Find NFT collections that interest you.' />
            </Head>
            <Collections />
        </>
    )
}
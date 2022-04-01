import { Contract, ethers } from "ethers";
import { Marketplace, NFT } from "../../typechain-types";
import MarketplaceInterface from "../../contracts/Marketplace.json";
import NftInterface from "../../contracts/NFT.json";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { decodeMetadataUri } from "../../utils/nft";
import { NftCollection as INftCollection } from "../../types/nft";
import NftCollection, { NftCollectionSkeleton } from "../../components/pages/collections/nftCollection";
import { useRouter } from "next/router";
import Head from "next/head";

let provider: ethers.providers.JsonRpcProvider;
if (process.env.NODE_ENV === "development") {
    provider = new ethers.providers.JsonRpcProvider();
} else {
    provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_POLYGON_JSON_RPC_URL as string);
}

export const getStaticPaths = async () => {
    const marketplaceContract: Marketplace = new Contract(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS as string, MarketplaceInterface.abi, provider) as Marketplace;
    const allNftCollectionsFromContract = await marketplaceContract.getAllNftCollections();

    return {
        paths: allNftCollectionsFromContract.map(({ nftContractAddr }) => ({
            params: {
                nftContractAddr
            }
        })),
        fallback: true
    }
}

export const getStaticProps = async (ctx: GetStaticPropsContext) => {
    const nftContractAddr: string = ctx.params?.nftContractAddr as string;
    const nftContract: NFT = new Contract(nftContractAddr, NftInterface.abi, provider) as NFT;
    const nftsUnstruct = await nftContract.getAllNfts();

    const [name, symbol, description, author] = await Promise.all([
        nftContract.name(),
        nftContract.symbol(),
        nftContract.description(),
        nftContract.authorAddr()
    ]);

    const nftCollection: INftCollection = {
        name,
        symbol,
        description,
        author,
        nftContractAddr,
        nftsInCollection: nftsUnstruct[0].map((tokenId, index) => ({
            tokenId: tokenId.toString(),
            tokenUri: decodeMetadataUri(nftsUnstruct[1][index]),
            tokenOwner: nftsUnstruct[2][index],
            tokenPrice: nftsUnstruct[3][index].toString()
        }))
    }

    return {
        props: {
            nftCollection
        },
        revalidate: 4
    }
}

export default function NftPage({ nftCollection }: InferGetStaticPropsType<typeof getStaticProps>) {

    const router = useRouter();

    return (
        <>
            <Head>
                <title>{nftCollection?.name || "NFTs"}</title>
                <meta property='og:title' content={nftCollection?.name || "NFTs"} />
                <meta name='twitter:title' content={nftCollection?.name || "NFTs"} />
                <meta name='description' content={nftCollection?.description || "Buy and sell NFTs in this collection."} />
                <meta property='og:description' content={nftCollection?.description || "Buy and sell NFTs in this collection."} />
                <meta name='twitter:description' content={nftCollection?.description || "Buy and sell NFTs in this collection."} />
            </Head>
            {router.isFallback ?
                <NftCollectionSkeleton /> :
                <NftCollection nftCollection={nftCollection} />}
        </>
    )
}

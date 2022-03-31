import { Contract, ethers } from 'ethers';
import type { InferGetStaticPropsType } from 'next'
import Home from '../components/pages/home';
import { Marketplace } from '../typechain-types';
import MarketplaceInterface from "../contracts/Marketplace.json";
import { structureIntoNftColls } from '../utils/nft';
import Head from "next/head";

// Preload some preview NFT collections for homepage
export const getStaticProps = async () => {
  let provider: ethers.providers.JsonRpcProvider;
  if (process.env.NODE_ENV === "development") {
    provider = new ethers.providers.JsonRpcProvider();
  } else {
    provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_POLYGON_JSON_RPC_URL as string);
  }

  const marketplaceContract: Marketplace = new Contract(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS as string, MarketplaceInterface.abi, provider) as Marketplace;
  const allNftCollectionsFromContract = await marketplaceContract.getAllNftCollections();
  const allNftCollections = structureIntoNftColls(allNftCollectionsFromContract);
  return {
    revalidate: 30,
    props: {
      allNftCollections
    }
  }
}

const HomePage = ({ allNftCollections }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <Head>
        <title>WOOFY Marketplace</title>
        <meta property='og:title' content='WOOFY Marketplace' />
        <meta name='twitter:title' content='WOOFY Marketplace' />
        <meta name='description' content='An NFT marketplace - Mint, sell and buy NFTs on POLYGON at very low fees.' />
        <meta property='og:description' content='An NFT marketplace - Mint, sell and buy NFTs on POLYGON at very low fees.' />
        <meta name='twitter:description' content='An NFT marketplace - Mint, sell and buy NFTs on POLYGON at very low fees.' />
      </Head>
      <Home allNftCollections={allNftCollections} />
    </>
  )
}

export default HomePage

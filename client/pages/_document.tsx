import { ColorModeScript } from '@chakra-ui/react';
import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import theme from '../theme';

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,300;1,400;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name='viewport' content='width=device-width' />
          <meta name="description" content="An NFT marketplace - Mint, sell and buy NFTs on POLYGON at very low fees." />
          <meta name="keywords" content="nft marketplace, nft, nft marketplace ethersjs nextjs" />
          <meta name="theme-color" content="#2d3748" />
          <meta name="apple-mobile-web-app-title" content="WOOFY Marketplace" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta property="og:image" content="https://woofy-market.vercel.app/woofy-marketplace.png" />
          <meta name="twitter:image" content="https://woofy-market.vercel.app/woofy-marketplace.png" />
          <meta property='og:site_name' content='WOOFY Marketplace' />
          <meta property='og:type' content='website' />
          <link rel="manifest" href="manifest.json" />
        </Head>
        <body>
          {/* 👇 Here's the script */}
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
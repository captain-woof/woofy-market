import type { AppProps } from 'next/app';
import { ChakraProvider } from "@chakra-ui/react";
import theme from '../theme';
import AppBar from '../components/organisms/appbar';
import { WalletProvider } from '../contexts/wallet/wallet';
import { WoofyProvider } from '../contexts/woofy/woofy';
import Marketplace from '../contexts/marketplace';
import "../styles/global.css";
import Footer from '../components/organisms/footer';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <WalletProvider>
        <WoofyProvider>
          <Marketplace.MarketplaceProvider>
            <AppBar />
            <Component {...pageProps} />
            <Footer />
          </Marketplace.MarketplaceProvider>
        </WoofyProvider>
      </WalletProvider>
    </ChakraProvider>
  )
}

export default MyApp

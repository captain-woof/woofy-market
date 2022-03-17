import type { AppProps } from 'next/app';
import { ChakraProvider } from "@chakra-ui/react";
import theme from '../theme';
import AppBar from '../components/organisms/appbar';
import { WalletProvider } from '../contexts/wallet/wallet';
import { WoofyProvider } from '../contexts/woofy/woofy';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <WalletProvider>
        <WoofyProvider>
          <AppBar />
          <Component {...pageProps} />
        </WoofyProvider>
      </WalletProvider>
    </ChakraProvider>
  )
}

export default MyApp

import type { AppProps } from 'next/app';
import { ChakraProvider } from "@chakra-ui/react";
import theme from '../theme';
import AppBar from '../components/appbar';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AppBar />
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default MyApp

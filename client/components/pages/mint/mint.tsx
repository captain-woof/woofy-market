import { Box, Button, Divider, Flex, Heading, Image, Skeleton, Text, useTheme } from "@chakra-ui/react";
import { ReactNode } from "react";
import { BiPurchaseTagAlt as BuyIcon } from "react-icons/bi";
import { useNftContract } from "./useNftContract";

export default function Mint() {
    const { mint, progressMint, nftsOwned, numOfNftsOwned, progressFetchNfts } = useNftContract();
    const theme = useTheme();

    return (
        <Flex flexDirection={{ base: "column", md: "row" }} flexWrap="nowrap" height={{ base: "auto", md: "calc(100vh - 4.5rem)" }} padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto">
            {/* NFT base image */}
            <Box position="relative" height={{ base: "40vh", md: "full" }} width={{ base: "full", md: "50%" }} padding={{ base: "2", md: "4" }} display="flex" alignItems="flex-start" justifyContent="center">
                <Image src={process.env.NEXT_PUBLIC_NFT_IMAGE_BASE as string} alt="NFT image of WOOFY" objectFit="contain" width={{ base: "full", md: "75%" }} maxWidth={{ base: "auto", md: "350px" }} height={{ base: "full", md: "auto" }} />
            </Box>

            {/* Purchase and NFTs owned section */}
            <Box as="main" position="relative" minHeight={{ base: "auto", md: "full" }} width={{ base: "full", md: "50%" }} padding={{ base: "2", md: "4" }}>

                {/* Purchase */}
                <Heading size="3xl" textAlign={{ base: "center", md: "start" }}>Mint your WOOFY</Heading>
                <Text marginTop="6"><b>Woofy</b> is a super-dog; he has the superpower of turning anybody&apos;s bad day into a good one. Mint your Woofy token and see your day instantly brighten!</Text>
                <Text fontSize="2xl" fontWeight={800} marginTop="6" textAlign={{ base: "center", md: "start" }}>1 WFY = 0.001 MATIC</Text>
                <Button marginTop={{ base: "4", md: "2" }} leftIcon={<BuyIcon size="24" />} colorScheme="brand" aria-label="Buy WOOFY for 0.001 ethers" marginX={{ base: "auto", md: "unset" }} display="flex" onClick={mint} isLoading={progressMint} loadingText="Minting">Buy</Button>

                {/* NFTs owned */}
                <Divider marginTop={{ base: "12", md: "6" }} />
                <Heading size="xl" textAlign={{ base: "center", md: "start" }} marginTop={{ base: "12", md: "6" }}>Your WOOFYs</Heading>

                <Text marginTop={{ base: "4", md: "2" }} textAlign={{ base: "center", md: "start" }}>
                    {numOfNftsOwned.isZero() ?
                        "You don't own any WOOFYs yet!" :
                        `You own ${numOfNftsOwned.toString()} WOOFYs.`
                    }
                </Text>

                <Box display="grid" gap="4" marginTop="6" gridTemplateColumns={`repeat(auto-fit, minmax(${theme.space["28"]}, 1fr));`} paddingBottom="6">
                    {progressFetchNfts ?
                        Array(3).fill(0).map((_, i) => (
                            <Square key={i}>
                                <Skeleton position="absolute" inset="0" />
                            </Square>
                        )) :
                        nftsOwned.map(({ image, tokenId }) => (
                            <Square key={tokenId.toString()}>
                                <Image src={`https://ipfs.io/ipfs/${image.split("ipfs://")[1]}`} alt={`WOOFY token number ${tokenId}`} position="absolute" inset="0" />
                            </Square>
                        ))
                    }
                </Box>
            </Box>
        </Flex>
    )
}

const Square = ({ children }: { children: ReactNode }) => {
    return (
        <Box position="relative" width="full">
            <Box marginTop="100%" />
            {children}
        </Box>
    )
}
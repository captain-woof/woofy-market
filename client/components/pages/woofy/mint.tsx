import { Box, Button, Divider, Flex, Heading, Image, Skeleton, Text, useColorModeValue } from "@chakra-ui/react";
import { ethers } from "ethers";
import { ReactNode } from "react";
import { BiPurchaseTagAlt as BuyIcon } from "react-icons/bi";
import { useWallet } from "../../../hooks/useWallet";
import { useWoofyContract } from "../../../hooks/useWoofyContract";

export default function Mint() {
    const { mintWoofy, progressMintWoofy, woofysOwned, numOfWoofysOwned, progressFetchWoofys, maxWoofysNum, woofyMintedsNum } = useWoofyContract();
    const { isConnected } = useWallet();
    const highlightColor = useColorModeValue("black", "brand.500");

    return (
        <>
            {/* Mint WOOFY section */}
            <Flex as="section" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto" flexDirection={{ base: "column", md: "row" }} flexWrap="nowrap">

                {/* NFT base image */}
                <Box position="relative" height={{ base: "40vh", md: "full" }} width={{ base: "full", md: "50%" }} padding={{ base: "2", md: "4" }} display="flex" alignItems="flex-start" justifyContent="center">
                    <Image src={process.env.NEXT_PUBLIC_NFT_IMAGE_BASE as string} alt="NFT image of WOOFY" objectFit="contain" width={{ base: "full", md: "75%" }} maxWidth={{ base: "auto", md: "350px" }} height={{ base: "full", md: "auto" }} fallback={<Skeleton height="full" width="full" />} />
                </Box>

                {/* Purchase and NFTs owned section */}
                <Box as="main" position="relative" minHeight={{ base: "auto", md: "full" }} width={{ base: "full", md: "50%" }} padding={{ base: "2", md: "4" }}>

                    {/* Purchase */}
                    <Heading size="3xl" textAlign={{ base: "center", md: "start" }}>Mint your WOOFY</Heading>
                    <Text marginTop="6"><b>Woofy</b> is a super-dog; he has the superpower of bestowing good luck. Mint your Woofy token and see your day instantly brighten!</Text>
                    <Text color={highlightColor} marginTop="6" fontWeight={700}>Each WOOFY token you own decreases marketplace commission rate by 0.05% when making a sale!</Text>
                    <Text marginTop="6" color={highlightColor} fontStyle="italic">There is an upper limit to the total number of WOOFYs that can be minted, after which the only way to get more WOOFYs is to buy them from people who have put theirs for sale!</Text>
                    <Text fontSize="2xl" fontWeight={800} marginTop="6" textAlign={{ base: "center", md: "start" }}>1 WFY = 0.1 MATIC</Text>

                    <Flex flexWrap="wrap" alignItems="center" gap={{ base: "4", md: "2" }} marginTop={{ base: "4", md: "2" }} width="fit-content" marginX={{ base: "auto", md: "unset" }} flexDirection={{ base: "column", md: "row" }}>
                        <Button leftIcon={<BuyIcon size="24" />} colorScheme="brand" aria-label="Buy WOOFY for 0.1 matic" marginX={{ base: "auto", md: "unset" }} display="flex" onClick={mintWoofy} isLoading={progressMintWoofy} loadingText="Minting" disabled={isConnected && maxWoofysNum.eq(woofyMintedsNum)} width="fit-content">Buy</Button>

                        {isConnected &&
                            <Text fontSize="md" color={highlightColor} textAlign={{ base: "center", md: "start" }}>{maxWoofysNum.sub(woofyMintedsNum).toString()} out of {maxWoofysNum.toString()} remaining!</Text>
                        }
                    </Flex>
                </Box>
            </Flex>

            {/* WOOFYs owned section */}
            {isConnected &&
                <>
                    <Divider marginY={{ base: "6", md: "unset" }} />
                    <Box as="section" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto" marginTop="2">
                        <Heading size="3xl" textAlign="center" marginTop={{ base: "2", md: "unset" }}>Your WOOFYs</Heading>

                        <Text marginTop={{ base: "4", md: "2" }} textAlign="center">
                            {numOfWoofysOwned.isZero() ?
                                "You don't own any WOOFYs yet!" :
                                `You own ${numOfWoofysOwned.toString()}/${maxWoofysNum.toString()} WOOFYs.`
                            }
                        </Text>

                        <Flex marginTop="6" paddingBottom="6" flexWrap="wrap">
                            {progressFetchWoofys ?
                                Array(3).fill(0).map((_, i) => (
                                    <Square key={i}>
                                        <Skeleton width="full" height="full" flexGrow={1} />
                                    </Square>
                                )) :
                                woofysOwned.map(({ image, tokenId, price }) => (
                                    <Square key={tokenId.toString()}>
                                        <Image src={`https://ipfs.io/ipfs/${image.split("ipfs://")[1]}`} alt={`WOOFY token number ${tokenId}, owned by you`} height="full" width="full" />
                                        <Text position="absolute" top="4" right="6" color="gray.800">{ethers.utils.formatEther(price)} MATIC</Text>
                                    </Square>
                                ))
                            }
                        </Flex>
                    </Box>
                </>
            }
        </>
    )
}

const Square = ({ children }: { children: ReactNode }) => {
    return (
        <Box position="relative" width="full" maxWidth={{ base: "full", sm: "50%", md: "33.33%" }}>
            <Box marginTop="100%" />
            <Box position="absolute" inset="2">
                {children}
            </Box>
        </Box>
    )
}
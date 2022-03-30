import { Box, Button, Flex, Heading, Image, Text } from "@chakra-ui/react"
import { Marketplace } from "../../../typechain-types"
import { decodeMetadataUri, getIpfsFileUri } from "../../../utils/nft"
import HighlightedText from "../../atoms/highlightedText"
import Link from "next/link";
import { MdOutlineCreate as CreateIcon } from "react-icons/md";

interface Home {
    allNftCollections: Marketplace.NftCollectionStruct[]
}

export default function Home({ allNftCollections }: Home) {

    return (
        <Box as="main" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto">
            {/* Heading */}
            <Heading textAlign="center" size="4xl" marginTop="8">WOOFY MARKETPLACE</Heading>
            <Text textAlign="center" marginTop="2">Your one-stop marketplace to <HighlightedText>mint, list, buy and sell NFT collections</HighlightedText>.</Text>

            {/* NFT collections for display */}
            <Flex flexWrap="nowrap" width="full" marginTop="10" gap="4" overflowX="auto">
                {allNftCollections.slice(0, 3).map((nftCollection, index) => (
                    <Box key={index} width={{ base: "60%", md: "33%" }} minWidth="64" backgroundColor="white">
                        <Link passHref href={`/collections/${nftCollection.nftContractAddr}`}><a>
                            <Image alt={`${nftCollection.name} NFT Collection - ${nftCollection.description}`} src={getIpfsFileUri(decodeMetadataUri(nftCollection.nftsInCollection[0].metadataUri).image as string)} width="full" />
                            <Box padding="4">
                                <Heading color="black">{nftCollection.name}</Heading>
                                <Text color="black">{nftCollection.description}</Text>
                            </Box>
                        </a></Link>
                    </Box>
                ))}
            </Flex>

            {/* CTA - Create collection */}
            <Heading textAlign="center" marginTop="8">
                These are just some NFT collections created here. <HighlightedText usedFor="heading">Create yours today!</HighlightedText>
            </Heading>
            <Link passHref href="/create"><a>
                <Button marginX="auto" marginTop="4" width="33%" colorScheme="brand" fontWeight="600" rightIcon={<CreateIcon size="18" />} display="flex" alignItems="center">Create</Button>
            </a></Link>
        </Box >
    )
}
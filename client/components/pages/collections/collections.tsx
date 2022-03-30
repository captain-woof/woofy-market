import { Alert, AlertIcon, Box, Flex, Grid, GridItem, Heading, Image, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useColorModeValue } from "@chakra-ui/react";
import { useMarketplaceContract } from "../../../hooks/useMarketplaceContract"
import { useWallet } from "../../../hooks/useWallet";
import { Marketplace } from "../../../typechain-types";
import Link from "next/link";
import { decodeMetadataUri, getIpfsFileUri } from "../../../utils/nft";

export default function Collections() {
    const tabTextColor = useColorModeValue("black", "brand");
    const { allNftCollections, allNftCollectionsAuthored, allNftCollectionsWhereSignerOwnsTokens, allNftCollectionsWhereTokenOnSale } = useMarketplaceContract();
    const { isConnected } = useWallet();

    return (

        <Tabs colorScheme={tabTextColor}>
            <TabList marginBottom="2" paddingX={{ base: "0", md: "16" }} marginTop="8">
                <Tab minWidth={{ base: "auto", md: "24" }} flexGrow={{ base: 1, md: "unset" }} isDisabled={!isConnected} fontSize={{ base: "sm", md: "md" }}>All</Tab>
                <Tab minWidth={{ base: "auto", md: "24" }} flexGrow={{ base: 1, md: "unset" }} isDisabled={!isConnected} fontSize={{ base: "sm", md: "md" }}>Authored</Tab>
                <Tab minWidth={{ base: "auto", md: "24" }} flexGrow={{ base: 1, md: "unset" }} isDisabled={!isConnected} fontSize={{ base: "sm", md: "md" }}>Owned</Tab>
                <Tab minWidth={{ base: "auto", md: "24" }} flexGrow={{ base: 1, md: "unset" }} isDisabled={!isConnected} fontSize={{ base: "sm", md: "md" }}>Sale</Tab>
            </TabList>

            {!isConnected ?
                <Alert colorScheme="brand" textAlign="center" status="warning" variant="solid">
                    <AlertIcon />
                    Your wallet needs to be connected to see the NFT collections!
                </Alert> :
                <>
                    <TabPanels>
                        <TabPanel>
                            <NftCollections collectionsToDisplay={allNftCollections} />
                        </TabPanel>
                        <TabPanel>
                            <NftCollections collectionsToDisplay={allNftCollectionsAuthored} />
                        </TabPanel>
                        <TabPanel>
                            <NftCollections collectionsToDisplay={allNftCollectionsWhereSignerOwnsTokens} />
                        </TabPanel>
                        <TabPanel>
                            <NftCollections collectionsToDisplay={allNftCollectionsWhereTokenOnSale} />
                        </TabPanel>
                    </TabPanels>
                </>
            }
        </Tabs>
    )
}

// Component for collections display
interface NftCollections {
    collectionsToDisplay: Array<Marketplace.NftCollectionStructOutput>;
}
const NftCollections = ({ collectionsToDisplay }: NftCollections) => {
    return (
        <Grid as="main" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto" gap="6" templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}>
            {collectionsToDisplay.map((collectionToDisplay) => (
                <GridItem key={collectionToDisplay.nftContractAddr} as="figure" width="full" backgroundColor="white" wordBreak="break-word">
                    <Link passHref href={`/collections/${collectionToDisplay.nftContractAddr}`}><a>
                        <Image alt={`${collectionToDisplay.name} NFT Collection - ${collectionToDisplay.description}`} src={getIpfsFileUri(decodeMetadataUri(collectionToDisplay.nftsInCollection[0].metadataUri).image as string)} width="full" />
                        <Box padding="4">
                            <Heading as="figcaption" color="black">{collectionToDisplay.name}</Heading>
                            <Text color="blackAlpha.500" fontWeight="700" fontSize="sm" fontStyle="italic">Author: {collectionToDisplay.author}</Text>
                            <Text color="black" marginTop="2">{collectionToDisplay.description}</Text>
                        </Box>
                    </a></Link>
                </GridItem>
            ))}
        </Grid>
    )
}
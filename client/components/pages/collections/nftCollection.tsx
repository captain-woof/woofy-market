import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, FormControl, FormHelperText, FormLabel, Grid, GridItem, Heading, Image, Input, Skeleton, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useRef, useState } from "react";
import { useNftCollection } from "../../../hooks/useNftCollection";
import { useWallet } from "../../../hooks/useWallet";
import { Nft, NftCollection as INftCollection } from "../../../types/nft"
import { getNftStatus, NftStatus } from "../../../utils/nft";
import { isStringsEqualCaseInsensitive } from "../../../utils/string";

interface NftCollection {
    nftCollection: INftCollection;
}

export default function NftCollection({ nftCollection: nftCollectionInitital }: NftCollection) {
    const { signerAddr } = useWallet();
    const [putNftForSaleDialogVisible, setPutNftForSaleDialogVisible] = useState<boolean>(false);
    const { buyNft, cancelSaleNft, nftCollection, progressBuy, progressCancel, progressSale, putForSaleNft } = useNftCollection(nftCollectionInitital, setPutNftForSaleDialogVisible);
    const putNftForSaleCloseButtonRef = useRef<HTMLButtonElement | null>(null);
    const [nftForSaleAmount, setNftForSaleAmount] = useState<string>("");
    const [nftSelected, setNftSelected] = useState<Nft>();

    // Handles closing 'Put nft for sale' dialog
    const handleNftForSaleDialogClose = useCallback(() => {
        setPutNftForSaleDialogVisible(false);
    }, []);

    return (
        <Box as="main" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto">

            <Heading size="3xl" marginTop="4">
                {nftCollection.name} <Text as="span" fontWeight="500" fontSize="4xl">({nftCollection.symbol})</Text>
            </Heading>
            <Text fontStyle="italic" fontSize="sm" fontWeight="500">
                <Text as="span" fontWeight="800">ADDRESS:</Text> {nftCollection.nftContractAddr}
            </Text>
            <Text fontStyle="italic" fontSize="sm" fontWeight="500">
                <Text as="span" fontWeight="800">AUTHOR:</Text> {nftCollection.author} {isStringsEqualCaseInsensitive(nftCollection.author, signerAddr) && <Text as="span" fontWeight="800">(YOU)</Text>}
            </Text>
            <Text marginTop="4">
                {nftCollection.description}
            </Text>

            <Grid gap="6" templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} marginTop="8">
                {nftCollection.nftsInCollection.map((nft) => {
                    const nftStatus = getNftStatus(signerAddr, nft);
                    return (
                        <GridItem key={nft.tokenId.toString()} as="figure" width="full" wordBreak="break-word" display="flex" flexDirection="column">
                            <Image alt={`${nft.tokenUri.name} NFT - ${nft.tokenUri.description}`} src={nft.tokenUri.image} width="full" />
                            <Box padding="4" backgroundColor="white" flexGrow="1">
                                <Heading as="figcaption" color="black">{nft.tokenUri.name}</Heading>
                                <Text color="blackAlpha.500" fontWeight="700" fontSize="sm" fontStyle="italic">Owner: {nft.tokenOwner}</Text>
                                <Text color="black" marginTop="2">{nft.tokenUri.description}</Text>
                            </Box>
                            <Button borderRadius={0} width="full" colorScheme="brand" disabled={(nftStatus === NftStatus.OWN_NOT_FOR_SALE || nftStatus === NftStatus.OWN_FOR_SALE) ? false : (nftStatus === NftStatus.NOT_OWN_NOT_FOR_SALE ? true : (BigNumber.from(nft.tokenId).eq(nftSelected?.tokenId ?? "-1") && (progressBuy || progressCancel || progressSale)))} onClick={async () => {
                                setNftSelected(nft);
                                switch (nftStatus) {
                                    case NftStatus.OWN_FOR_SALE:
                                        await cancelSaleNft(nft.tokenId);
                                        break;
                                    case NftStatus.OWN_NOT_FOR_SALE:
                                        setPutNftForSaleDialogVisible(true);
                                        break;
                                    case NftStatus.NOT_OWN_FOR_SALE:
                                        await buyNft(nft.tokenId);
                                        break;
                                }
                            }} isLoading={BigNumber.from(nft.tokenId).eq(nftSelected?.tokenId ?? "-1") && (progressBuy || progressCancel || progressSale)}>
                                {nftStatus === NftStatus.OWN_FOR_SALE ? "Cancel" : (nftStatus === NftStatus.OWN_NOT_FOR_SALE ? "Sell" : "Buy")}
                            </Button>
                            <Text width="full" padding="2" textAlign="center" backgroundColor={nftStatus === NftStatus.NOT_OWN_NOT_FOR_SALE ? "gray.500" : (nftStatus === NftStatus.OWN_FOR_SALE ? "green.500" : "blue.400")} color="white">
                                {nftStatus === NftStatus.OWN_FOR_SALE ? "Owned; listed for sale" : (nftStatus === NftStatus.OWN_NOT_FOR_SALE ? "Owned; not for sale" : (nftStatus === NftStatus.NOT_OWN_FOR_SALE ? "On sale" : "Not for sale"))}
                                {(nftStatus === NftStatus.OWN_FOR_SALE || nftStatus === NftStatus.NOT_OWN_FOR_SALE) && ` - ${ethers.utils.formatEther(nft.tokenPrice)} MATIC`}
                            </Text>
                        </GridItem>
                    )
                })}
            </Grid>

            {/* PUT FOR SALE DIALOG */}
            <AlertDialog isOpen={putNftForSaleDialogVisible} onClose={handleNftForSaleDialogClose} leastDestructiveRef={putNftForSaleCloseButtonRef} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>

                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Put NFT for sale
                        </AlertDialogHeader>

                        <AlertDialogBody>

                            <FormControl>
                                <FormLabel>Selling price</FormLabel>
                                <Input min="0" focusBorderColor="brand.500" value={nftForSaleAmount} onChange={(e) => { setNftForSaleAmount(e.target.value) }} type="number" placeholder="XX.XX (MATIC)" />
                                <FormHelperText>Set the price <i>(in MATIC)</i> to sell this NFT for.</FormHelperText>
                            </FormControl>
                            {/*!!woofySelected &&
                                <Text fontStyle="italic" marginTop={type === "not-sell" ? "2" : "0"} fontSize="sm" fontWeight="600">{type === "not-sell" ? "Previously set" : "Listed for"}: {ethers.utils.formatEther(woofySelected?.price as BigNumber)} MATIC</Text>
                            */}
                        </AlertDialogBody>

                        <AlertDialogFooter gap="4">
                            <Button ref={putNftForSaleCloseButtonRef} onClick={handleNftForSaleDialogClose}>Close</Button>
                            <Button colorScheme="brand" onClick={() => { putForSaleNft(nftSelected?.tokenId ?? "-1", nftForSaleAmount) }} isLoading={progressSale} loadingText="Putting for sale">
                                Put for sale
                            </Button>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

        </Box>
    )
}

export function NftCollectionSkeleton() {
    return (
        <Grid as="main" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto" gap="6" templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} marginTop="8">
            {Array(3).fill(0).map((_, index) => (
                <GridItem key={index} width="full" wordBreak="break-word" height="32rem">
                    <Skeleton width="full" height="full" />
                </GridItem>
            ))}
        </Grid>
    )
}
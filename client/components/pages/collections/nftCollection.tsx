import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, FormControl, FormHelperText, FormLabel, Grid, GridItem, Heading, Image, Input, Skeleton, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useRef, useState } from "react";
import { useNftCollection } from "../../../hooks/useNftCollection";
import { useWallet } from "../../../hooks/useWallet";
import { Nft, NftCollection as INftCollection } from "../../../types/nft"
import { getIpfsFileUri, getNftStatus, NftStatus } from "../../../utils/nft";
import { isStringsEqualCaseInsensitive } from "../../../utils/string";
import { MdLibraryAdd as AddNftIcon } from "react-icons/md";
import { FaExternalLinkAlt as LinkIcon } from "react-icons/fa";
import MintNftDialog from "./mintNftDialog";
import { useWoofyContract } from "../../../hooks/useWoofyContract";
import Link from "next/link";

interface NftCollection {
    nftCollection: INftCollection;
}

export default function NftCollection({ nftCollection: nftCollectionInitital }: NftCollection) {
    const { signerAddr } = useWallet();
    const [putNftForSaleDialogVisible, setPutNftForSaleDialogVisible] = useState<boolean>(false);
    const { buyNft, cancelSaleNft, nftCollection, progressBuy, progressCancel, progressSale, putForSaleNft, progressMint, mintNft } = useNftCollection(nftCollectionInitital, setPutNftForSaleDialogVisible);
    const putNftForSaleCloseButtonRef = useRef<HTMLButtonElement | null>(null);
    const [nftForSaleAmount, setNftForSaleAmount] = useState<string>("");
    const [nftSelected, setNftSelected] = useState<Nft>();
    const [mintNftDialogVisible, setMintNftDialogVisible] = useState<boolean>(false);
    const { numOfWoofysOwned } = useWoofyContract();

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

            {isStringsEqualCaseInsensitive(signerAddr, nftCollection.author) &&
                <>
                    <Button colorScheme="brand" rightIcon={<AddNftIcon size="24" />} marginLeft="auto" display="flex" justifyContent="center" alignItems="center" onClick={() => { setMintNftDialogVisible(true) }} isLoading={progressMint} loadingText="Minting">
                        Mint
                    </Button>
                    <Text marginLeft="auto" textAlign="end" fontStyle="italic" fontWeight="500" fontSize="sm" marginTop="2">
                        Only you (the collection author) can do this
                    </Text>

                    <MintNftDialog mintNftDialogVisible={mintNftDialogVisible} setMintNftDialogVisible={setMintNftDialogVisible} progressMint={progressMint} mintNft={mintNft} />
                </>
            }

            <Grid gap="6" templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} marginTop="8">
                {nftCollection.nftsInCollection.map((nft) => {
                    const nftStatus = getNftStatus(signerAddr, nft);
                    return (
                        <GridItem key={nft.tokenId.toString()} as="figure" width="full" wordBreak="break-word" display="flex" flexDirection="column">
                            <Image alt={`${nft.tokenUri.name} NFT - ${nft.tokenUri.description}`} src={getIpfsFileUri(nft.tokenUri.image as string)} width="full" fallback={<Skeleton width="full" height="20rem" />} />
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
            <AlertDialog isOpen={putNftForSaleDialogVisible} onClose={() => { setPutNftForSaleDialogVisible(false); }} leastDestructiveRef={putNftForSaleCloseButtonRef} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>

                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Put NFT for sale
                        </AlertDialogHeader>

                        <AlertDialogBody>

                            <FormControl isRequired>
                                <FormLabel>Selling price</FormLabel>
                                <Input min="0" focusBorderColor="brand.500" value={nftForSaleAmount} onChange={(e) => { setNftForSaleAmount(e.target.value) }} type="number" placeholder="XX.XX (MATIC)" />
                                <FormHelperText>Current marketplace commission: {3 - (numOfWoofysOwned.toNumber() * 0.05)}%</FormHelperText>
                                <Link passHref href="/woofy"><a>
                                    <Text marginTop="2" fontStyle="italic" fontWeight="600" fontSize="sm" color="brand.500">Buy more WOOFY tokens to decrease marketplace commission <LinkIcon display="inline" /></Text>
                                </a></Link>
                            </FormControl>

                        </AlertDialogBody>

                        <AlertDialogFooter gap="4">
                            <Button ref={putNftForSaleCloseButtonRef} onClick={() => { setPutNftForSaleDialogVisible(false); }}>Close</Button>
                            <Button colorScheme="brand" onClick={() => { putForSaleNft(nftSelected?.tokenId ?? "-1", nftForSaleAmount) }} isLoading={progressSale} loadingText="Putting for sale" disabled={progressSale || (nftForSaleAmount === "")}>
                                Put for sale
                            </Button>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

        </Box >
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
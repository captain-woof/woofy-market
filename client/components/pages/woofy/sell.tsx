import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogHeader, AlertDialogOverlay, AlertDialogFooter, Box, Button, Divider, Flex, FormControl, FormHelperText, FormLabel, Heading, Image, Input, Skeleton, Text, Tooltip, useTheme, useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { ReactNode, useCallback, useRef, useState } from "react";
import { BiPurchaseTagAlt as SellIcon } from "react-icons/bi";
import { MdOutlineCancelPresentation as CancelIcon } from "react-icons/md";
import { Woofy } from "../../../types/woofy";
import { NFT_STATUS } from "../../../enums/woofy_sale_status";
import { useWoofyContract } from "../../../hooks/useWoofyContract";
import { useWallet } from "../../../hooks/useWallet";

export default function Sell() {
    const { woofysOwned } = useWoofyContract();

    return (
        <Box as="section" marginTop={{ base: "4", md: "12" }}>

            <Heading size="3xl" textAlign="center">Sell your WOOFYs</Heading>

            <Flex padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto" flexDirection={{ base: "column", md: "row" }} flexWrap="nowrap">

                {/* WOOFYs not for sale */}
                <WoofysGrid title="Unlisted" woofysToDisplay={woofysOwned.filter((woofyOwned) => woofyOwned.status === NFT_STATUS.NOT_FOR_SALE)} type="not-sell" />

                <Divider orientation='vertical' />

                {/* WOOFYs for sale */}
                <WoofysGrid title="For sale" woofysToDisplay={woofysOwned.filter((woofyOwned) => woofyOwned.status === NFT_STATUS.FOR_SALE)} type="sell" />

            </Flex>

        </Box>
    )
}

const WoofysGrid = ({ woofysToDisplay, title, type }: { woofysToDisplay: Array<Woofy>, title: string, type: "sell" | "not-sell" }) => {
    const { progressFetchWoofys, putForSale, progressSell, cancelSale, progressCancel } = useWoofyContract();
    const theme = useTheme();
    const { woofyContractConn } = useWoofyContract();
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const [sellAmount, setSellAmount] = useState<string>("0");
    const [woofySelected, setWoofySelected] = useState<Woofy | null>(null);
    const toast = useToast();

    // Handles closing sell dialog
    const handleCloseDialog = useCallback(() => {
        setDialogVisible(false);
    }, [])

    // Handles confirming sale
    const handleSellButtonClick = useCallback(async () => {
        if (!!woofyContractConn) {
            const sellAmountNum = parseFloat(sellAmount);
            if (!isNaN(sellAmountNum) && sellAmountNum >= 0) {
                await putForSale(woofySelected?.tokenId as BigNumber, sellAmount);
                setSellAmount("0");
                handleCloseDialog();
            } else {
                toast({
                    title: "ERROR",
                    description: "Invalid price set! Please check and try again.",
                    status: "error"
                })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [woofyContractConn, sellAmount, woofySelected, toast])

    // Handles cancelling sale
    const handleCancelButtonClick = useCallback(async () => {
        if (!!woofyContractConn) {
            await cancelSale(woofySelected?.tokenId as BigNumber);
            handleCloseDialog();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [woofyContractConn, woofySelected, toast])

    return (
        <Box as="section" position="relative" width={{ base: "full", md: "50%" }} padding={{ base: "2", md: "4" }}>

            <Heading size="2xl" textAlign="center" marginTop={{ base: "2", md: "unset" }}>{title}</Heading>

            <Text marginTop={{ base: "4", md: "2" }} textAlign="center">
                {woofysToDisplay.length === 0 ?
                    "No data to display!" :
                    `${woofysToDisplay.length} WOOFYs here.`
                }
            </Text>

            <Box display="grid" marginTop="6" columnGap="4" rowGap="12" gridTemplateColumns={{ base: `repeat(2, minmax(${theme.space["16"]}, 1fr))`, md: `repeat(3, minmax(${theme.space["16"]}, 1fr))` }}>
                {progressFetchWoofys ?
                    Array(3).fill(0).map((_, i) => (
                        <Square key={i}>
                            <Skeleton width="full" height="full" flexGrow={1} position="absolute" inset="0" />
                        </Square>
                    )) :
                    woofysToDisplay.map((woofyToDisplay) => (
                        <Box key={woofyToDisplay.tokenId.toString()} width="full" position="relative">
                            <Tooltip aria-label={type === "not-sell" ? `Previous listed price was ${ethers.utils.formatEther(woofyToDisplay.price)} MATIC` : `Currently listed for ${ethers.utils.formatEther(woofyToDisplay.price)} MATIC`} label={type === "not-sell" ? "Previous listed price" : "Currently listed for"} placement="top">
                                <Text textAlign="center" userSelect="none">{ethers.utils.formatEther(woofyToDisplay.price)} MATIC</Text>
                            </Tooltip>
                            <Image src={`https://ipfs.io/ipfs/${woofyToDisplay.image.split("ipfs://")[1]}`} alt={`${title} - WOOFY token number ${woofyToDisplay.tokenId}`} marginTop="2" width="full" />
                            <Button colorScheme="brand" width="full" borderRadius="0" leftIcon={type === "not-sell" ? <SellIcon /> : <CancelIcon />} isLoading={(type === "not-sell" ? progressSell : progressCancel) && woofySelected?.tokenId.eq(woofyToDisplay.tokenId)} loadingText={type === "not-sell" ? "Selling" : "Cancelling"} onClick={() => {
                                setWoofySelected(woofyToDisplay);
                                setSellAmount(ethers.utils.formatEther(woofyToDisplay.price));
                                setDialogVisible(true);
                            }}>{type === "not-sell" ? "Sell" : "Cancel"}</Button>
                        </Box>
                    ))
                }
            </Box>

            <AlertDialog isOpen={dialogVisible} onClose={handleCloseDialog} leastDestructiveRef={cancelButtonRef} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>

                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            {type === "not-sell" ? "Put WOOFY for sale" : "De-list WOOFY from sale"}
                        </AlertDialogHeader>

                        <AlertDialogBody>

                            {type === "not-sell" &&
                                <FormControl>
                                    <FormLabel>Selling price</FormLabel>
                                    <Input focusBorderColor="brand.500" value={sellAmount} onChange={(e) => { setSellAmount(e.target.value) }} type="number" placeholder="XX.XX (MATIC)" />
                                    <FormHelperText>Set the price <i>(in MATIC)</i> you want to sell this WOOFY for.</FormHelperText>
                                </FormControl>
                            }
                            {!!woofySelected &&
                                <Text fontStyle="italic" marginTop={type === "not-sell" ? "2" : "0"} fontSize="sm" fontWeight="600">{type === "not-sell" ? "Previously set" : "Listed for"}: {ethers.utils.formatEther(woofySelected?.price as BigNumber)} MATIC</Text>
                            }
                        </AlertDialogBody>

                        <AlertDialogFooter gap="4">
                            <Button ref={cancelButtonRef} onClick={handleCloseDialog}>Cancel</Button>
                            <Button colorScheme="brand" onClick={type === "not-sell" ? handleSellButtonClick : handleCancelButtonClick} isLoading={type === "not-sell" ? progressSell : progressCancel} loadingText={type === "not-sell" ? "Listing" : "De-listing"}>{type === "not-sell" ? "List for sale" : "De-list from sale"}</Button>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

        </Box >
    )
}

const Square = ({ children }: { children: ReactNode }) => {
    return (
        <Box position="relative">
            <Box marginTop="100%" />
            {children}
        </Box>
    )
}
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Heading, Image, Skeleton, Text, Tooltip, useTheme, useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { BiPurchaseTagAlt as BuyIcon } from "react-icons/bi";
import { useWallet } from "../../../hooks/useWallet";
import { Woofy } from "../../../types/woofy";
import { useWoofyContract } from "../../../hooks/useWoofyContract";

export default function Buy() {
    const { woofysForSaleByOthers } = useWoofyContract();
    const { isConnected } = useWallet();

    return (
        <>
            {isConnected &&
                <>
                    <Box as="section" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto" marginTop="2">

                        <Heading size="3xl" textAlign="center" marginTop={{ base: "2", md: "unset" }}>Buy WOOFYs</Heading>

                        <Text marginTop={{ base: "4", md: "2" }} textAlign="center">
                            {woofysForSaleByOthers.length === 0 ?
                                "No WOOFYs are listed for sale by others :(" :
                                `${woofysForSaleByOthers.length} WOOFYs are on sale by others.`
                            }
                        </Text>

                        <BuyWoofsForSaleGrid />

                    </Box>
                </>
            }
        </>
    )
}

const BuyWoofsForSaleGrid = () => {
    const { progressGetAllWoofysForSaleByOthers, woofysForSaleByOthers, buyWoofyForSale, progressBuy } = useWoofyContract();
    const theme = useTheme();
    const { woofyContractConn } = useWoofyContract();
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const [woofySelected, setWoofySelected] = useState<Woofy | null>(null);
    const toast = useToast();

    // Handles closing sell dialog
    const handleCloseDialog = useCallback(() => {
        setDialogVisible(false);
    }, [])

    // Handles confirming sale
    const handleBuyButtonClick = useCallback(async () => {
        if (!!woofyContractConn) {
            await buyWoofyForSale(woofySelected as Woofy);
            handleCloseDialog();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [woofyContractConn, woofySelected, toast])

    return (
        <Box as="section" position="relative" width="full" padding={{ base: "2", md: "4" }} marginTop="6">

            <Box display="grid" marginTop="6" columnGap="4" rowGap="12" gridTemplateColumns={{ base: `repeat(2, minmax(${theme.space["16"]}, 1fr))`, md: `repeat(3, minmax(${theme.space["16"]}, 1fr))` }}>
                {progressGetAllWoofysForSaleByOthers ?
                    Array(3).fill(0).map((_, i) => (
                        <Square key={i}>
                            <Skeleton width="full" height="full" flexGrow={1} position="absolute" inset="0" />
                        </Square>
                    )) :
                    woofysForSaleByOthers.map((woofyForSaleByOthers) => (
                        <Box key={woofyForSaleByOthers.tokenId.toString()} width="full" position="relative">
                            <Tooltip label="Price this WOOFY is selling for; non-negotiable." placement="top">
                                <Text position="absolute" top="6" right="6" fontSize="lg" userSelect="none" color="black">{ethers.utils.formatEther(woofyForSaleByOthers.price)} MATIC</Text>
                            </Tooltip>
                            <Image src={`https://ipfs.io/ipfs/${woofyForSaleByOthers.image?.split("ipfs://")[1]}`} alt={`WOOFY token number ${woofyForSaleByOthers.tokenId}`} marginTop="2" width="full" />
                            <Button colorScheme="brand" width="full" borderRadius="0" leftIcon={<BuyIcon />} isLoading={progressBuy && woofySelected?.tokenId.eq(woofyForSaleByOthers.tokenId)} loadingText="Buying" onClick={() => {
                                setWoofySelected(woofyForSaleByOthers);
                                setDialogVisible(true);
                            }}>Buy</Button>
                        </Box>
                    ))
                }
            </Box>

            <AlertDialog isOpen={dialogVisible} onClose={handleCloseDialog} leastDestructiveRef={cancelButtonRef} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>

                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Buy WOOFY
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {!!woofySelected &&
                                <Text>Purchase this WOOFY for {ethers.utils.formatEther(woofySelected?.price as BigNumber)} MATIC ?</Text>
                            }
                        </AlertDialogBody>

                        <AlertDialogFooter gap="4">
                            <Button ref={cancelButtonRef} onClick={handleCloseDialog}>Cancel</Button>
                            <Button colorScheme="brand" onClick={handleBuyButtonClick} isLoading={progressBuy} loadingText="Buying">Buy</Button>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

        </Box>
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
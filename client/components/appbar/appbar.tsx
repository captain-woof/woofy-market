import { Flex, useColorModeValue, Heading, Link as ChakraLink, LinkProps as ChakraLinkProps, Box, HStack, IconButton, useColorMode, Button, Show, Menu, MenuButton, MenuList, MenuItem, Hide, MenuDivider, MenuGroup } from "@chakra-ui/react";
import NextLink from "next/link";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useWallet } from "../../hooks/useWallet";
import { IoWalletSharp as WalletOpenIcon } from "react-icons/io5";
import { FaWallet as WalletClosedIcon } from "react-icons/fa";
import { CgMenuGridO as MenuIcon } from "react-icons/cg";

export default function AppBar() {
    const backgroundColor = useColorModeValue("brand.400", "gray.700");
    const ColorModeChangerIcon = useColorModeValue(MoonIcon, SunIcon);
    const colorModeChangerButtonColor = useColorModeValue("gray", "brand");
    const { toggleColorMode } = useColorMode();

    return (
        <Flex background={backgroundColor} width="full" position="sticky" top={0} left={0} as="header" minHeight="14" shadow="lg" paddingY="4" paddingX="8" alignItems="center">
            <Link href="/"><Heading size="lg" color="gray.50">Woof Market</Heading></Link>
            <Box marginLeft="auto">
                <HStack spacing="10" height="full">

                    {/* Show navlinks for wider screens */}
                    <Show above="md">
                        <Link href="/list">List</Link>
                        <Link href="/woofy">WOOFY</Link>
                        <IconButton aria-label="Switch theme" colorScheme={colorModeChangerButtonColor} icon={<ColorModeChangerIcon />} isRound variant="outline" onClick={toggleColorMode} />
                        <ConnectWalletButton />
                    </Show>

                    {/* Show menu for smaller screens */}
                    <Hide above="md">
                        <Menu>
                            <MenuButton as={IconButton} aria-label='Navigation menu' icon={<MenuIcon />} isRound />
                            <MenuList>
                                <MenuGroup title="Wallet">
                                    <MenuItem><ConnectWalletButton /></MenuItem>
                                </MenuGroup>
                                <MenuDivider />
                                <MenuGroup title="Links">
                                    <MenuItem><Link href="/list">List</Link></MenuItem>
                                    <MenuItem><Link href="/woofy">WOOFY</Link></MenuItem>
                                </MenuGroup>
                                <MenuDivider />
                                <MenuItem><Button aria-label="Switch theme" colorScheme={colorModeChangerButtonColor} rightIcon={<ColorModeChangerIcon />} variant="outline" onClick={toggleColorMode} width="full">Switch theme</Button></MenuItem>
                            </MenuList>
                        </Menu>
                    </Hide>
                </HStack>
            </Box>
        </Flex>
    )
}

// Link component
const Link = (props: ChakraLinkProps) => (
    <NextLink passHref href={props?.href || "#"}>
        <ChakraLink color={{ base: "brand.500", md: "gray.50" }} fontSize="lg" fontWeight={700} width={{ base: "full", md: "fit-content" }}>{props?.children}</ChakraLink>
    </NextLink>
)

// Connect button
const ConnectWalletButton = () => {
    const { setup, signerAddr, progress } = useWallet();

    return (
        <Button loadingText="Connecting" isLoading={progress} colorScheme="brand" aria-label="Connect your wallet" display="flex" gap="2" onClick={setup} width={{ base: "full", md: "fit-content" }}>
            {signerAddr === "" ?
                <>Connect <WalletClosedIcon size="20" /></> :
                <>Connected <WalletOpenIcon size="20" /></>
            }
        </Button>
    )
}
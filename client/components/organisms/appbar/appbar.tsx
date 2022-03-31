import { Flex, useColorModeValue, Heading, Link as ChakraLink, Box, HStack, IconButton, useColorMode, Button, Show, Menu, MenuButton, MenuList, MenuItem, Hide, MenuDivider, MenuGroup } from "@chakra-ui/react";
import NextLink from "next/link";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useWallet } from "../../../hooks/useWallet";
import { IoWalletSharp as WalletOpenIcon } from "react-icons/io5";
import { FaWallet as WalletClosedIcon } from "react-icons/fa";
import { CgMenuGridO as MenuIcon } from "react-icons/cg";
import { useEffect, useState } from "react";

const NAV_LINKS = [
    {
        name: "Collections",
        url: "/collections"
    },
    {
        name: "Create",
        url: "/create"
    },
    {
        name: "Woofy",
        url: "/woofy"
    }
]

export default function AppBar() {
    const backgroundColor = useColorModeValue("brand.400", "gray.700");
    const ColorModeChangerIcon = useColorModeValue(MoonIcon, SunIcon);
    const colorModeChangerButtonColor = useColorModeValue("gray", "brand");
    const { toggleColorMode } = useColorMode();
    const { handleConnect, isConnected, progress } = useWallet();
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, [])

    return (
        <Flex background={backgroundColor} width="full" position="sticky" top={0} left={0} as="header" minHeight="14" shadow="lg" paddingY="4" paddingX="8" alignItems="center" zIndex={99999}>

            {/* App logo */}
            <NextLink passHref href="/"><ChakraLink>
                <Heading size="lg" color="gray.50">Woof Market</Heading>
            </ChakraLink></NextLink>

            {/* Nav links and menu */}
            {mounted &&
                <Box marginLeft="auto">
                    <HStack spacing="10" height="full" as="nav">

                        {/* Show navlinks for wider screens */}
                        <Show above="md">
                            {NAV_LINKS.map((navLink, index) => (
                                <NextLink key={index} passHref href={navLink.url}>
                                    <ChakraLink color="gray.50" fontSize="lg" fontWeight={700}>{navLink.name}</ChakraLink>
                                </NextLink>
                            ))}
                            <IconButton aria-label="Switch theme" colorScheme={colorModeChangerButtonColor} icon={<ColorModeChangerIcon />} isRound variant="outline" onClick={toggleColorMode} />
                            <Button loadingText="Connecting" isLoading={progress} colorScheme="brand" aria-label="Connect your wallet" display="flex" gap="2" onClick={handleConnect} width={{ base: "full", md: "fit-content" }}>
                                {isConnected ?
                                    <>Connected <WalletOpenIcon size="20" /></> :
                                    <>Connect <WalletClosedIcon size="20" /></>
                                }
                            </Button>
                        </Show>

                        {/* Show menu for smaller screens */}
                        <Hide above="md">
                            <Menu>
                                <MenuButton as={IconButton} aria-label='Navigation menu' icon={<MenuIcon />} isRound />
                                <MenuList>
                                    <MenuGroup title="Wallet">
                                        <MenuItem aria-label="Connect wallet" onClick={handleConnect} display="flex" alignItems="center" gap="2" color="brand.500">
                                            {isConnected ?
                                                <>Connected <WalletOpenIcon size="20" /></> :
                                                <>Connect <WalletClosedIcon size="20" /></>
                                            }
                                        </MenuItem>
                                    </MenuGroup>
                                    <MenuDivider />
                                    <MenuGroup title="Links">
                                        {NAV_LINKS.map((navLink, index) => (
                                            <MenuItem key={index}>
                                                <NextLink passHref href={navLink.url}>
                                                    <ChakraLink width="full">{navLink.name}</ChakraLink>
                                                </NextLink>
                                            </MenuItem>
                                        ))}
                                    </MenuGroup>
                                    <MenuDivider />
                                    <MenuGroup title="Settings">
                                        <MenuItem aria-label="Switch theme" onClick={toggleColorMode} display="flex" alignItems="center" gap="2">Switch theme <ColorModeChangerIcon /></MenuItem>
                                    </MenuGroup>
                                </MenuList>
                            </Menu>
                        </Hide>
                    </HStack>
                </Box>
            }
        </Flex>
    )
}

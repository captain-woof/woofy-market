import { Flex, useColorModeValue, Heading, Link as ChakraLink, LinkProps as ChakraLinkProps, Box, HStack, IconButton, useColorMode, styled } from "@chakra-ui/react";
import NextLink from "next/link";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export default function AppBar() {
    const backgroundColor = useColorModeValue("brand.400", "gray.700");
    const ColorModeChangerIcon = useColorModeValue(MoonIcon, SunIcon);
    const colorModeChangerButtonColor = useColorModeValue("gray", "brand");
    const { toggleColorMode } = useColorMode();

    return (
        <Flex background={backgroundColor} width="full" position="sticky" top={0} left={0} as="header" minHeight="14" shadow="lg" paddingY="4" paddingX="8">
            <Link href="/"><Heading size="lg" color="gray.50">Woof Market</Heading></Link>
            <Box marginLeft="auto">
                <HStack spacing="10" height="full">
                    <Link href="/list">List</Link>
                    <Link href="/woofy">WOOFY</Link>
                    <IconButton aria-label="Switch theme" colorScheme={colorModeChangerButtonColor} icon={<ColorModeChangerIcon />} isRound variant="outline" onClick={toggleColorMode} />
                </HStack>
            </Box>
        </Flex>
    )
}

// Link component
const Link = (props: ChakraLinkProps) => (
    <NextLink passHref href={props?.href || "#"}>
        <ChakraLink color="gray.50" fontSize="lg" fontWeight={700}>{props?.children}</ChakraLink>
    </NextLink>
)
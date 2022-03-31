import { Box, Divider, Heading, Text } from "@chakra-ui/react";
import { FaExternalLinkAlt as LinkIcon } from "react-icons/fa";

export default function Footer() {
    return (
        <Box as="footer" width="full">
            <Box maxWidth="5xl" marginX="auto" padding="4" width="full">
                <Divider />

                <Text textAlign="center" marginTop="8">
                    <a href="https://twitter.com/realCaptainWoof" target="_blank" rel="noreferrer">Coded by <Text as="span" fontWeight="700">Sohail Saha</Text> (@realCaptainWoof)<LinkIcon size="0.75rem" style={{ display: "inline", marginLeft: "0.5rem" }} /></a>
                </Text>

                <Heading fontSize="3xl" textAlign="center" marginTop="1" marginBottom="4">
                    Built on Polygon (Mumbai)
                </Heading>
            </Box>
        </Box>
    )
}
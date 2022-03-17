import { Tab, TabList, TabPanel, TabPanels, Tabs, useColorModeValue, useMediaQuery, useTheme } from "@chakra-ui/react";
import Mint from "./mint";

export default function Woofy() {

    const theme = useTheme();
    const isWidescreen = useMediaQuery(`(min-width: ${theme.breakpoints["md"]})`);
    const tabTextColor = useColorModeValue("black", "brand");

    return (
        <Tabs colorScheme={tabTextColor} isFitted={!isWidescreen}>
            <TabList marginBottom="2" paddingX="16" marginTop="8">
                <Tab>Mint</Tab>
                <Tab>Buy</Tab>
                <Tab>Sell</Tab>
            </TabList>

            <TabPanels>

                {/* Mint tab */}
                <TabPanel>
                    <Mint />
                </TabPanel>

                {/* Buy tab */}

                {/* Sell tab */}
            </TabPanels>
        </Tabs>
    )
}
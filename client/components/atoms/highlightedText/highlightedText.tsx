import { Text, TextProps, useColorModeValue } from "@chakra-ui/react";

interface HighlightedText extends TextProps {
    usedFor?: "text" | "heading";
}

const filterProps = (props: HighlightedText): TextProps => {
    const filteredProps = {...props};
    delete filteredProps["usedFor"];
    return filteredProps;
}

export default function HighlightedText(props: HighlightedText) {
    const textColor = useColorModeValue("black", "brand.500");

    return (
        <Text {...filterProps(props)} color={textColor} as="span" textDecoration={props?.usedFor === "heading" ? (props?.textDecoration || "underline") : "auto"}>
            {props?.children}
        </Text>
    )
}
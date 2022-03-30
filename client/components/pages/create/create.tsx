import { Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Input, Text, Textarea, useColorModeValue } from "@chakra-ui/react";
import { useFormik } from "formik";
import { useMarketplaceContract } from "../../../hooks/useMarketplaceContract"
import { useWallet } from "../../../hooks/useWallet";
import * as yup from "yup";
import { useRouter } from "next/router";
import { dev } from "../../../utils/log";
import { MdOutlineCreate as CreateIcon } from "react-icons/md";

export default function Create() {
    const router = useRouter();
    const { createNewNftCollection, progressCreateNftCollection } = useMarketplaceContract();
    const { isConnected } = useWallet();
    const formik = useFormik({
        initialValues: {
            name: "",
            symbol: "",
            description: ""
        },
        validationSchema: yup.object({
            name: yup.string().required("Required"),
            symbol: yup.string().required("Required"),
            description: yup.string()
        }),
        onSubmit: async ({ name, symbol, description }, { setFieldValue, setSubmitting }) => {
            try {
                const nftContract = await createNewNftCollection(name, symbol, description);
                if (!nftContract) {
                    throw new Error();
                } else {
                    setFieldValue("name", "");
                    setFieldValue("symbol", "");
                    setFieldValue("description", "");
                    router.push(`/collections/${nftContract?.address}`);
                }
            } catch (e) {
                dev.error(e);
            } finally {
                setSubmitting(false);
            }
        }
    });
    const formBackgroundColor = useColorModeValue("gray.100", "gray.700");

    return (
        <Box as="main" padding={{ base: "4", md: "8" }} maxWidth="5xl" marginX="auto">
            {!isConnected ?
                <Alert colorScheme="brand" textAlign="center" status="warning" variant="solid">
                    <AlertIcon />
                    Your wallet needs to be connected to create new NFT collections!
                </Alert> :

                <Box maxWidth="xl" marginX="auto" borderRadius="lg" paddingX="6" paddingY="8" backgroundColor={formBackgroundColor}>
                    <form onSubmit={formik.handleSubmit}>
                        <Heading fontSize="5xl">Create new NFT collection</Heading>

                        <FormControl marginTop="8" isInvalid={!!formik.errors.name} isRequired>
                            <FormLabel>Name</FormLabel>
                            <Input name="name" value={formik.values.name} onChange={formik.handleChange} autoComplete="off" placeholder="My awesome NFT" />
                            <FormHelperText>Name of your NFT collection</FormHelperText>
                            <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
                        </FormControl>

                        <FormControl marginTop="6" isInvalid={!!formik.errors.symbol} isRequired>
                            <FormLabel>Symbol</FormLabel>
                            <Input name="symbol" value={formik.values.symbol} onChange={formik.handleChange} autoComplete="off" placeholder="SYM" />
                            <FormHelperText>Symbol to represent your NFT collection</FormHelperText>
                            <FormErrorMessage>{formik.errors.symbol}</FormErrorMessage>
                        </FormControl>

                        <FormControl marginTop="6" isInvalid={!!formik.errors.description}>
                            <FormLabel>Description</FormLabel>
                            <Textarea rows={5} resize="none" name="description" value={formik.values.description} onChange={formik.handleChange} autoComplete="off" placeholder="This NFT collection is about..." />
                            <FormHelperText>Description of your NFT collection</FormHelperText>
                            <FormErrorMessage>{formik.errors.description}</FormErrorMessage>
                        </FormControl>

                        <Button colorScheme="brand" marginLeft="auto" marginTop="8" type="submit" onClick={() => { formik.handleSubmit(); }} isLoading={progressCreateNftCollection} disabled={progressCreateNftCollection} loadingText="Creating" rightIcon={<CreateIcon size="18" />} display="flex" alignItems="center">
                            Create
                        </Button>

                        <Text textAlign="end" marginTop="4" fontStyle="italic" fontSize="sm" fontWeight="600" opacity={0.7}>
                            You will be able to mint new NFTs after you create the collection.
                        </Text>
                    </form>
                </Box>
            }
        </Box>
    )
}
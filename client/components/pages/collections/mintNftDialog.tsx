import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Image, Input, InputGroup, InputLeftElement, Skeleton, Textarea, VStack } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { FiFile as FileIcon } from "react-icons/fi";
import { BiCrop as CropIcon } from "react-icons/bi";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

const nftImageTypesAccepted = "image/jpeg,image/png,image/gif,image/svg,image/webp";

interface MintNftDialog {
    mintNftDialogVisible: boolean;
    setMintNftDialogVisible: Dispatch<SetStateAction<boolean>>;
    progressMint: boolean;
    mintNft: (name: string, description: string, image: Blob) => Promise<void>;
}

export default function MintNftDialog({ mintNftDialogVisible, setMintNftDialogVisible, progressMint, mintNft }: MintNftDialog) {
    const mintNftDialogCloseButtonRef = useRef<HTMLButtonElement | null>(null);
    const fileUploadInputRef = useRef<HTMLInputElement | null>(null);
    const [isCropped, setIsCropped] = useState<boolean>(false);
    const [cropperInstance, setCropperInstance] = useState<Cropper>();
    const formik = useFormik({
        initialValues: {
            description: "",
            name: "",
            image: new File([], ""),
            imageUploadUri: "",
            imageUploadBlob: new Blob()
        },
        validationSchema: yup.object({
            description: yup.string(),
            name: yup.string().required("You must provide a name for this NFT"),
            image: yup.mixed().required("You must upload an image to represent this NFT")
        }),
        onSubmit: async ({ name, description, imageUploadBlob, imageUploadUri }, { setFieldValue, setSubmitting }) => {
            if (imageUploadUri === "" || !isCropped) {
                formik.setFieldError("image", "You must upload an image to represent this NFT");
            } else {
                try {
                    await mintNft(name, description, imageUploadBlob);
                } finally {
                    setSubmitting(false);
                    setMintNftDialogVisible(false);
                    setFieldValue("name", "");
                    setFieldValue("description", "");
                    setIsCropped(false);
                    setFieldValue("image", new File([], ""));
                    setFieldValue("imageUploadBlob", new Blob());
                    setFieldValue("imageUploadUri", "");
                }
            }
        }
    });

    return (
        <AlertDialog isOpen={mintNftDialogVisible} onClose={() => { setMintNftDialogVisible(false); }} leastDestructiveRef={mintNftDialogCloseButtonRef} isCentered>
            <AlertDialogOverlay>
                <AlertDialogContent>

                    <Box maxHeight="60vh" overflowX="hidden" width="full">
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Mint new NFT
                        </AlertDialogHeader>

                        <AlertDialogBody>

                            <form onSubmit={formik.handleSubmit}>

                                <VStack gap="4">
                                    <FormControl isInvalid={!!formik.errors.name} isRequired>
                                        <FormLabel>Name</FormLabel>
                                        <Input colorScheme="brand" name="name" value={formik.values.name} onChange={formik.handleChange} placeholder="My awesome NFT" autoComplete="off" />
                                        <FormHelperText>Name of the NFT</FormHelperText>
                                        <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
                                    </FormControl>

                                    <FormControl isInvalid={!!formik.errors.image} isRequired>
                                        <FormLabel>Image</FormLabel>

                                        {(formik.values.image?.name !== "" && !isCropped) ?
                                            <>
                                                <Cropper src={formik.values.imageUploadUri} aspectRatio={1} guides style={{ width: "100%", height: "20rem" }} crop={(e) => { setCropperInstance(e.currentTarget.cropper); }} accept={nftImageTypesAccepted} alt="Image cropper" />
                                                <Button colorScheme="brand" display="flex" justifyContent="center" alignItems="center" marginLeft="auto" marginTop="4" rightIcon={<CropIcon size="20" />} onClick={() => {
                                                    const croppedImgUrl = cropperInstance?.getCroppedCanvas().toDataURL();
                                                    formik.setFieldValue("imageUploadUri", croppedImgUrl);

                                                    cropperInstance?.getCroppedCanvas().toBlob((croppedImgBlob) => { formik.setFieldValue("imageUploadBlob", croppedImgBlob) });
                                                    setIsCropped(true);
                                                }}>
                                                    Done
                                                </Button>
                                            </> :

                                            <>
                                                {formik.values.imageUploadUri !== "" &&
                                                    <Image src={formik.values.imageUploadUri} alt="cropped nft image" width="full" cursor="pointer" onClick={() => { fileUploadInputRef.current?.click() }} fallback={<Skeleton width="full" height="20rem" />} />
                                                }

                                                <InputGroup minHeight="3rem" display="flex" alignItems="center">
                                                    <InputLeftElement pointerEvents="none" top="1">
                                                        <FileIcon />
                                                    </InputLeftElement>

                                                    <Input cursor="pointer" onClick={() => { fileUploadInputRef.current?.click() }} placeholder="Upload" value={formik.values.image?.name || "No file selected"} readOnly variant={isCropped ? "filled" : "outline"} />

                                                    <input type="file" name="image" onChange={(e) => {
                                                        formik.setFieldValue("image", e.target.files?.item(0));

                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            formik.setFieldValue("imageUploadUri", reader.result);
                                                            setIsCropped(false);
                                                        };
                                                        reader.readAsDataURL(e.target.files?.item(0) as Blob);
                                                        formik.setFieldValue("imageUploadBlob", e.target.files?.item(0) as Blob);
                                                    }} accept={nftImageTypesAccepted} style={{ display: "none" }} ref={fileUploadInputRef} />
                                                </InputGroup>
                                            </>
                                        }
                                        {!isCropped &&
                                            <>
                                                <FormHelperText>Image for the NFT</FormHelperText>
                                                <FormErrorMessage>{formik.errors.image}</FormErrorMessage>
                                            </>
                                        }
                                    </FormControl>

                                    <FormControl isInvalid={!!formik.errors.description}>
                                        <FormLabel>Description</FormLabel>
                                        <Textarea colorScheme="brand" name="description" value={formik.values.description} onChange={formik.handleChange} rows={5} placeholder="This NFT is about..." />
                                        <FormHelperText>Description of the NFT</FormHelperText>
                                        <FormErrorMessage>{formik.errors.description}</FormErrorMessage>
                                    </FormControl>

                                </VStack>

                            </form>

                        </AlertDialogBody>
                    </Box>

                    <AlertDialogFooter gap="4">
                        <Button ref={mintNftDialogCloseButtonRef} onClick={() => { setMintNftDialogVisible(false); }}>Close</Button>
                        <Button type="submit" colorScheme="brand" onClick={async () => { formik.handleSubmit(); }} isLoading={progressMint} loadingText="Minting" isDisabled={!formik.isValid}>
                            Mint
                        </Button>
                    </AlertDialogFooter>

                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}
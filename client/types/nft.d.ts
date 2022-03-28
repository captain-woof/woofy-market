// NFT metadata interface
export interface MetadataObj {
    image?: string,
    image_data?: string,
    external_url?: string,
    description?: string,
    name?: string,
    background_color?: string,
    animation_url?: string,
    youtube_url?: string,
    attributes?: Array<{
        trait_type: string,
        value: string | number,
        display_type?: "boost_number" | "boost_percentage" | "number"
    }>
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Utils.sol";

contract Woofy is ERC721URIStorage {
    /* NFT price */
    uint256 price = 0.001 ether;

    /* Counter for TokenId */
    using Counters for Counters.Counter;
    Counters.Counter private _tokenId;

    /* Mapping to store info about new NFTs: whether their metadata should be changed */
    mapping(address => uint256) newMintAddressToId;

    /* Constructor */
    constructor() payable ERC721("WOOFY", "WFY") {
        _tokenId.increment();
    }

    /* Creates a new NFT */
    function createNFT() external payable {
        // Check if user is paying the correct amount to purchase
        require(
            msg.value == price,
            strcat(
                "INCORRECT AMOUNT OF WEI SENT! SEND ",
                Strings.toString(price)
            )
        );

        // Mint token
        uint256 newTokenId = _tokenId.current();
        _safeMint(msg.sender, newTokenId);
        newMintAddressToId[msg.sender] = newTokenId;

        // Increment token id
        _tokenId.increment();
    }

    /* Returns new, incomplete token id that a signer may have */
    function getNewTokenId() public view returns (uint256) {
        return newMintAddressToId[msg.sender];
    }

    /* Sets URI on newly created NFT */
    function setNewTokenURI(string memory _nftImageURI) external {
        // Checks to make sure URI of existing NFTs are not modified, only a new one
        uint256 newTokenId = newMintAddressToId[msg.sender];
        require(
            newTokenId != 0,
            "SIGNER DOES NOT HAVE A NEWLY MINTED, INCOMPLETE NFT!"
        );

        // Create new token's URI
        string memory tokenMetadataJson = Base64.encode(
            bytes(
                abi.encodePacked(
                    '{"name":"Woofy","description":"Woofy is a cute dog, likes to play superhero in a cape. Each NFT of him is marked with a unique number. Get yours today!!","attributes":[{"trait_type":"Cuteness","value":100,"display_type":"boost_number"},{"trait_type":"Heroism","value":75,"display_type":"boost_number"}],"image":"',
                    _nftImageURI,
                    '"}'
                )
            )
        );
        string memory tokenURI = string(
            bytes(
                abi.encodePacked(
                    "data:application/json;base64,",
                    tokenMetadataJson
                )
            )
        );

        // Set new token's uri
        _setTokenURI(newTokenId, tokenURI);
        delete newMintAddressToId[msg.sender];
    }
}

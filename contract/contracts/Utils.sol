// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/* STRUCTS */
struct IdAndTime {
    uint256 tokenId;
    uint256 timestamp;
}

enum NFT_STATUS {
    FOR_SALE,
    NOT_FOR_SALE
}

struct NFT {
    uint256 tokenID;
    string tokenURI;
    uint256 price;
    NFT_STATUS status;
    address owner;
}

struct NFT_SALE_INFO {
    uint256 price;
    NFT_STATUS status;
}

/* FUNCTIONS */
function strcat(string memory str1, string memory str2)
    pure
    returns (string memory)
{
    return string(abi.encodePacked(str1, str2));
}

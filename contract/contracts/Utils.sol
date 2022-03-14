// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

function strcat(string memory str1, string memory str2) pure returns (string memory) {
    return string(abi.encodePacked(str1, str2));
}

struct IdAndTime {
    uint256 tokenId;
    uint256 timestamp;
}

struct NFT {
    uint256 tokenID;
    string tokenURI;
}
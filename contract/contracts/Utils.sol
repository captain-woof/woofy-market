// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/* FUNCTIONS */
function strcat(string memory str1, string memory str2)
    pure
    returns (string memory)
{
    return string(abi.encodePacked(str1, str2));
}

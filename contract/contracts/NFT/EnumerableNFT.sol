// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

contract EnumerableNFT is
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable
{
    // STATE VARS
    mapping(uint256 => uint256) internal _tokenOnSaleIdToPrice;

    // Return all NFTs
    function getAllNfts()
        public
        view
        returns (
            uint256[] memory ids,
            string[] memory uris,
            address[] memory owners,
            uint256[] memory prices
        )
    {
        uint256 nftsNum = totalSupply();

        uint256[] memory tokenIds = new uint256[](nftsNum);
        string[] memory tokenUris = new string[](nftsNum);
        address[] memory tokenOwners = new address[](nftsNum);
        uint256[] memory tokenPrices = new uint256[](nftsNum);

        for (uint256 i = 0; i < nftsNum; i++) {
            uint256 id = tokenByIndex(i);
            tokenIds[i] = id;
            tokenUris[i] = tokenURI(id);
            tokenOwners[i] = ownerOf(id);
            tokenPrices[i] = _tokenOnSaleIdToPrice[id];
        }

        return (tokenIds, tokenUris, tokenOwners, tokenPrices);
    }

    // Return NFTs owned by signer
    function getNftsOwned()
        public
        view
        returns (
            uint256[] memory ids,
            string[] memory uris,
            address[] memory owners,
            uint256[] memory prices
        )
    {
        uint256 nftsOwnedNum = balanceOf(tx.origin);

        uint256[] memory tokenIds = new uint256[](nftsOwnedNum);
        string[] memory tokenUris = new string[](nftsOwnedNum);
        address[] memory tokenOwners = new address[](nftsOwnedNum);
        uint256[] memory tokenPrices = new uint256[](nftsOwnedNum);

        for (uint256 i = 0; i < nftsOwnedNum; i++) {
            uint256 id = tokenOfOwnerByIndex(tx.origin, i);
            tokenIds[i] = id;
            tokenUris[i] = tokenURI(id);
            tokenOwners[i] = tx.origin;
            tokenPrices[i] = _tokenOnSaleIdToPrice[id];
        }

        return (tokenIds, tokenUris, tokenOwners, tokenPrices);
    }

    // Returns number of tokens on sale
    function getNftsOnSaleNum() public view returns (uint256) {
        uint256 nftsOnSaleNum = 0;
        uint256 totalTokens = totalSupply();
        for (uint256 i = 0; i < totalTokens; i++) {
            if (_tokenOnSaleIdToPrice[tokenByIndex(i)] != 0) {
                nftsOnSaleNum += 1;
            }
        }
        return nftsOnSaleNum;
    }

    // Return NFTs on sale
    function getNftsOnSale()
        public
        view
        returns (
            uint256[] memory ids,
            string[] memory uris,
            address[] memory owners,
            uint256[] memory prices
        )
    {
        uint256 nftsOnSaleNum = getNftsOnSaleNum();
        uint256[] memory tokenIds = new uint256[](nftsOnSaleNum);
        string[] memory tokenUris = new string[](nftsOnSaleNum);
        address[] memory tokenOwners = new address[](nftsOnSaleNum);
        uint256[] memory tokenPrices = new uint256[](nftsOnSaleNum);

        uint256 index = 0;
        for (uint256 i = 0; i < totalSupply(); i++) {
            if (_tokenOnSaleIdToPrice[tokenByIndex(i)] != 0) {
                uint256 id = tokenByIndex(i);
                tokenIds[index] = id;
                tokenUris[index] = tokenURI(id);
                tokenOwners[index] = ownerOf(id);
                tokenPrices[index] = _tokenOnSaleIdToPrice[id];
                index += 1;
            }
        }

        return (tokenIds, tokenUris, tokenOwners, tokenPrices);
    }

    // Overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

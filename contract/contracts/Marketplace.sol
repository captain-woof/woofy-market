// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFT/NFT.sol";
import "./Woofy.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    // LIBRARY AUGS
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    // STRUCTS
    struct Nft {
        uint256 tokenId;
        string metadataUri;
        address owner;
        uint256 price;
    }

    struct NftCollection {
        string name;
        string symbol;
        string description;
        address author;
        address nftContractAddr;
        Nft[] nftsInCollection;
    }

    // EVENTS
    event NftContractCreated(
        address indexed contractAddr,
        address indexed author
    );
    event NftMinted(
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        address indexed mintedTo,
        string tokenUri
    );
    event NftOnSale(
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event NftSaleCancel(
        address indexed nftContractAddress,
        uint256 indexed tokenId
    );
    event NftBought(
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        address boughtBy,
        uint256 price
    );
    event CommissionReceivedByMarketplace(uint256 commission);

    // STATE VARS
    EnumerableSet.AddressSet private _nftContractAddrs; // Enumerable set of NFT contracts deployed, their addresses
    address public nftContractImplementation; // Address of NFT implementation contract
    address public woofyContractAddr; // Address of WOOFY nft

    // MODIFIERS
    modifier isValidNftContractAddr(address _nftContractAddr) {
        require(
            _nftContractAddrs.contains(_nftContractAddr),
            "NFT CONTRACT ADDRESS DOES NOT EXIST"
        );
        _;
    }

    // Constructor
    constructor(address _nftContractImplementation, address _woofyContractAddr)
        payable
    {
        nftContractImplementation = _nftContractImplementation;
        woofyContractAddr = _woofyContractAddr;
    }

    // Function to create an NFT minimal proxy contract (this is to be done before minting)
    function createNftContract(
        string calldata _name,
        string calldata _symbol,
        string calldata _description
    ) external nonReentrant {
        address clonedNftContractAddr = Clones.clone(nftContractImplementation);
        NFT(clonedNftContractAddr).initialize(
            _name,
            _symbol,
            _description,
            payable(this),
            payable(woofyContractAddr)
        );
        _nftContractAddrs.add(clonedNftContractAddr);
        emit NftContractCreated(clonedNftContractAddr, msg.sender);
    }

    // Function to get list of all NFT collections
    function getAllNftCollections()
        public
        view
        returns (NftCollection[] memory)
    {
        uint256 totalNftContractsNum = _nftContractAddrs.length();
        NftCollection[] memory nftCollections = new NftCollection[](
            totalNftContractsNum
        );

        // Iterate over all contracts
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            // Get NFT collection
            address nftContractAddr = _nftContractAddrs.at(i);
            NFT nftContract = NFT(nftContractAddr);

            // Get NFTs in collection
            (
                uint256[] memory ids,
                string[] memory uris,
                address[] memory owners,
                uint256[] memory prices
            ) = nftContract.getAllNfts();
            Nft[] memory nfts = new Nft[](ids.length);
            for (uint256 j = 0; j < ids.length; j++) {
                nfts[j] = Nft(ids[j], uris[j], owners[j], prices[j]);
            }

            // Add to NFT collection array
            nftCollections[i] = NftCollection(
                nftContract.name(),
                nftContract.symbol(),
                nftContract.description(),
                nftContract.authorAddr(),
                nftContractAddr,
                nfts
            );
        }

        return nftCollections;
    }

    // Function to get list of all NFT collections where signer owns tokens; result contains only NFTs that are owned by signer
    function getNftsCollectionsWhereOwnerOwnsTokens()
        public
        view
        returns (NftCollection[] memory)
    {
        uint256 totalNftContractsNum = _nftContractAddrs.length();

        // Find num of nft contracts where signer owns at least one NFT
        uint256 nftContractsWhereOwnerOwnsNum = 0;
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            uint256 balance = NFT(_nftContractAddrs.at(i)).balanceOf(
                msg.sender
            );
            if (balance > 0) {
                nftContractsWhereOwnerOwnsNum += 1;
            }
        }

        // Fill NFT collection data
        NftCollection[]
            memory nftCollectionsOwnerOwnsToken = new NftCollection[](
                nftContractsWhereOwnerOwnsNum
            );
        uint256 index = 0;
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            address nftContractAddr = _nftContractAddrs.at(i);
            NFT nftContract = NFT(nftContractAddr);
            uint256 balance = nftContract.balanceOf(msg.sender);
            if (balance > 0) {
                // Get NFTs in collection
                (
                    uint256[] memory ids,
                    string[] memory uris,
                    address[] memory owners,
                    uint256[] memory prices
                ) = nftContract.getNftsOwned();
                Nft[] memory nfts = new Nft[](ids.length);
                for (uint256 j = 0; j < ids.length; j++) {
                    nfts[j] = Nft(ids[j], uris[j], owners[j], prices[j]);
                }

                // Add to nft collections array
                nftCollectionsOwnerOwnsToken[index] = NftCollection(
                    nftContract.name(),
                    nftContract.symbol(),
                    nftContract.description(),
                    msg.sender,
                    nftContractAddr,
                    nfts
                );

                index += 1;
            }
        }

        return nftCollectionsOwnerOwnsToken;
    }

    // Function to get list of all NFT collections where at least one token is on sale; result includes only NFTs that are on sale
    function getNftCollectionsWhereTokensOnSale()
        public
        view
        returns (NftCollection[] memory)
    {
        uint256 totalNftContractsNum = _nftContractAddrs.length();

        // Find num of nft contracts where tokens are on sale
        uint256 nftContractsWhereTokensOnSaleNum = 0;
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            uint256 nftsOnSaleNum = NFT(_nftContractAddrs.at(i))
                .getNftsOnSaleNum();
            if (nftsOnSaleNum > 0) {
                nftContractsWhereTokensOnSaleNum += 1;
            }
        }

        // Fill NFT collection data
        NftCollection[]
            memory nftCollectionsWhereTokensOnSale = new NftCollection[](
                nftContractsWhereTokensOnSaleNum
            );
        uint256 index = 0;
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            address nftContractAddr = _nftContractAddrs.at(i);
            NFT nftContract = NFT(nftContractAddr);
            uint256 nftsOnSaleNum = nftContract.getNftsOnSaleNum();
            if (nftsOnSaleNum > 0) {
                // Get NFTs in collection
                (
                    uint256[] memory ids,
                    string[] memory uris,
                    address[] memory owners,
                    uint256[] memory prices
                ) = nftContract.getNftsOnSale();
                Nft[] memory nfts = new Nft[](ids.length);
                for (uint256 j = 0; j < ids.length; j++) {
                    nfts[j] = Nft(ids[j], uris[j], owners[j], prices[j]);
                }

                // Add to nft collections array
                nftCollectionsWhereTokensOnSale[index] = NftCollection(
                    nftContract.name(),
                    nftContract.symbol(),
                    nftContract.description(),
                    nftContract.authorAddr(),
                    nftContractAddr,
                    nfts
                );

                index += 1;
            }
        }

        return nftCollectionsWhereTokensOnSale;
    }

    // Function to get list of all NFT collections authored by signer; contains all NFTs in collections authored
    function getNftsCollectionsAuthored()
        public
        view
        returns (NftCollection[] memory)
    {
        uint256 totalNftContractsNum = _nftContractAddrs.length();

        // Find num of nft contracts authored by signer
        uint256 nftContractsAuthoredNum = 0;
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            if (NFT(_nftContractAddrs.at(i)).authorAddr() == msg.sender) {
                nftContractsAuthoredNum += 1;
            }
        }

        // Fill NFT collection data
        NftCollection[]
            memory nftCollectionsOwnerOwnsToken = new NftCollection[](
                nftContractsAuthoredNum
            );
        uint256 index = 0;
        for (uint256 i = 0; i < totalNftContractsNum; i++) {
            address nftContractAddr = _nftContractAddrs.at(i);
            NFT nftContract = NFT(nftContractAddr);
            if (nftContract.authorAddr() == msg.sender) {
                // Get NFTs in collection
                (
                    uint256[] memory ids,
                    string[] memory uris,
                    address[] memory owners,
                    uint256[] memory prices
                ) = nftContract.getAllNfts();
                Nft[] memory nfts = new Nft[](ids.length);
                for (uint256 j = 0; j < ids.length; j++) {
                    nfts[j] = Nft(ids[j], uris[j], owners[j], prices[j]);
                }

                // Add to nft collections array
                nftCollectionsOwnerOwnsToken[index] = NftCollection(
                    nftContract.name(),
                    nftContract.symbol(),
                    nftContract.description(),
                    msg.sender,
                    nftContractAddr,
                    nfts
                );

                index += 1;
            }
        }

        return nftCollectionsOwnerOwnsToken;
    }

    receive() external payable {
        emit CommissionReceivedByMarketplace(msg.value);
    }
}

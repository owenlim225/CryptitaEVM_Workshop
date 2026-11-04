// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Gacha is ERC721URIStorage {
    error UnsupportedChain(uint256 chainId);
    error InvalidWinId();
    error InvalidMetadataURI();
    error AlreadyMinted(uint256 tokenId);
    error IncorrectPayment(uint256 sent);
    error NotCollectionOwner();
    error WithdrawalFailed();

    uint256 public constant SPIN_PRICE = 0.0001 ether;
    address public immutable collectionOwner;

    uint256 private nextTokenId = 1;
    mapping(address => mapping(bytes32 => uint256)) public mintedToken;

    constructor(bytes32 winId, string memory metadataUri) payable ERC721("Cryptita Gacha", "GACHA") {
        if (block.chainid != 84532) revert UnsupportedChain(block.chainid);
        collectionOwner = msg.sender;
        _mintCard(winId, metadataUri);
    }

    function mint(bytes32 winId, string calldata metadataUri) external payable returns (uint256) {
        return _mintCard(winId, metadataUri);
    }

    function withdraw() external {
        if (msg.sender != collectionOwner) revert NotCollectionOwner();
        (bool sent,) = payable(msg.sender).call{value: address(this).balance}("");
        if (!sent) revert WithdrawalFailed();
    }

    function _mintCard(bytes32 winId, string memory metadataUri) private returns (uint256 tokenId) {
        if (msg.value != SPIN_PRICE) revert IncorrectPayment(msg.value);
        if (winId == bytes32(0)) revert InvalidWinId();
        uint256 previousToken = mintedToken[msg.sender][winId];
        if (previousToken != 0) revert AlreadyMinted(previousToken);
        bytes memory uri = bytes(metadataUri);
        if (uri.length < 9 || uri.length > 256 ||
            uri[0] != 'h' || uri[1] != 't' || uri[2] != 't' || uri[3] != 'p' ||
            uri[4] != 's' || uri[5] != ':' || uri[6] != '/' || uri[7] != '/') revert InvalidMetadataURI();

        tokenId = nextTokenId++;
        mintedToken[msg.sender][winId] = tokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataUri);
    }
}

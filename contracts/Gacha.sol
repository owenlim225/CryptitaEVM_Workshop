// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Gacha is ERC721URIStorage {
    error UnsupportedChain(uint256 chainId);
    error InvalidWinId();
    error InvalidMetadataURI();
    error AlreadyMinted(uint256 tokenId);

    uint256 private nextTokenId = 1;
    mapping(address => mapping(bytes32 => uint256)) public mintedToken;

    constructor(bytes32 winId, string memory metadataUri) ERC721("Cryptita Gacha", "GACHA") {
        if (block.chainid != 97) revert UnsupportedChain(block.chainid);
        _mintCard(winId, metadataUri);
    }

    function mint(bytes32 winId, string calldata metadataUri) external returns (uint256) {
        return _mintCard(winId, metadataUri);
    }

    function _mintCard(bytes32 winId, string memory metadataUri) private returns (uint256 tokenId) {
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

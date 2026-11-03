// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract Gacha is ERC721 {
    error UnsupportedChain(uint256 chainId);
    error InvalidWinId();
    error InvalidMetadataSize(uint256 size);
    error AlreadyMinted(uint256 tokenId);

    uint256 private nextTokenId = 1;
    mapping(uint256 => string) private metadata;
    mapping(address => mapping(bytes32 => uint256)) public mintedToken;

    constructor(bytes32 winId, string memory metadataJson) ERC721("Cryptita Gacha", "GACHA") {
        if (block.chainid != 97) revert UnsupportedChain(block.chainid);
        _mintCard(winId, metadataJson);
    }

    function mint(bytes32 winId, string calldata metadataJson) external returns (uint256) {
        return _mintCard(winId, metadataJson);
    }

    function _mintCard(bytes32 winId, string memory metadataJson) private returns (uint256 tokenId) {
        if (winId == bytes32(0)) revert InvalidWinId();
        uint256 previousToken = mintedToken[msg.sender][winId];
        if (previousToken != 0) revert AlreadyMinted(previousToken);
        uint256 size = bytes(metadataJson).length;
        if (size == 0 || size > 8192) revert InvalidMetadataSize(size);

        // The browser supplies the winning card. This workshop accepts learner-authored metadata.
        tokenId = nextTokenId++;
        mintedToken[msg.sender][winId] = tokenId;
        metadata[tokenId] = metadataJson;
        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat("data:application/json;base64,", Base64.encode(bytes(metadata[tokenId])));
    }
}

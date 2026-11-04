// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Classroom demo: the caller selects the outcome. This is not a fair paid draw.
contract PaidGachaDemo is ERC721URIStorage, Ownable, ReentrancyGuard {
    error UnsupportedChain(uint256 chainId);
    error IncorrectPayment(uint256 sent);
    error WithdrawalFailed();

    uint256 public constant ROLL_PRICE = 0.0001 ether;
    string public constant CARD_URI = "https://ivory-additional-snail-831.mypinata.cloud/ipfs/bafkreibc7d3vnc24vsg3inh6s6qh6d2xlfhd62fexxt3n5pxtuoshsk7be";

    uint256 private nextTokenId;
    mapping(uint256 => uint8) public outcomeOf;

    event Rolled(address indexed player, uint256 indexed tokenId, uint8 outcome);

    constructor() ERC721("Cryptita Gacha Demo", "GACHA") Ownable(msg.sender) {
        if (block.chainid != 84532) revert UnsupportedChain(block.chainid);
    }

    function roll(uint8 outcome) external payable nonReentrant returns (uint256 tokenId) {
        if (msg.value != ROLL_PRICE) revert IncorrectPayment(msg.value);

        tokenId = nextTokenId++;
        outcomeOf[tokenId] = outcome;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, CARD_URI);
        emit Rolled(msg.sender, tokenId, outcome);
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool sent,) = payable(owner()).call{value: address(this).balance}("");
        if (!sent) revert WithdrawalFailed();
    }
}

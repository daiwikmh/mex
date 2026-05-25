// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BridgeInbox (StewardBridge — destination side, Base Sepolia)
/// @notice Trusted demo bridge destination. A single relayer calls `release` for each lock seen on
///         the source chain, minting a bridged token (bMUSD) to the recipient. Replay-protected by
///         source nonce. NOT trustless — the relayer is fully trusted. Testnet demos only.
contract BridgeInbox {
    // --- minimal ERC20 (bMUSD) ---
    string public constant name = "Mex Bridged MUSD";
    string public constant symbol = "bMUSD";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // --- bridge ---
    address public owner;
    address public relayer;
    mapping(uint256 => bool) public processed; // source nonce => released

    event Released(uint256 indexed sourceNonce, address indexed recipient, uint256 amount);
    event RelayerSet(address relayer);

    constructor(address relayer_) {
        require(relayer_ != address(0), "zero relayer");
        owner = msg.sender;
        relayer = relayer_;
        emit RelayerSet(relayer_);
    }

    function setRelayer(address relayer_) external {
        require(msg.sender == owner, "not owner");
        require(relayer_ != address(0), "zero relayer");
        relayer = relayer_;
        emit RelayerSet(relayer_);
    }

    /// @notice Relayer mints bridged tokens for a confirmed source-chain lock.
    function release(uint256 sourceNonce, address recipient, uint256 amount) external {
        require(msg.sender == relayer, "not relayer");
        require(!processed[sourceNonce], "already processed");
        require(recipient != address(0), "recipient zero");
        processed[sourceNonce] = true;
        totalSupply += amount;
        balanceOf[recipient] += amount;
        emit Transfer(address(0), recipient, amount);
        emit Released(sourceNonce, recipient, amount);
    }

    // --- ERC20 surface (so bMUSD can be used like any token, e.g. deposited into a vault) ---
    function transfer(address to, uint256 value) external returns (bool) {
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) allowance[from][msg.sender] = a - value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}

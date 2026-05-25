// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title BridgeOutbox (StewardBridge — source side, Mezo)
/// @notice Trusted demo bridge. Locks MUSD and emits an event a relayer watches to mint on the
///         destination chain. NOT trustless — a single relayer is authorized off-chain. The owner
///         can refund a lock if delivery never happens. For testnet demos only.
contract BridgeOutbox {
    IERC20 public immutable token;
    address public owner;
    uint256 public nextNonce;

    struct Lock {
        address sender;
        address recipient;
        uint256 amount;
        uint64 destChainId;
        bool refunded;
    }

    mapping(uint256 => Lock) public locks;

    uint256 private _guard = 1;
    modifier nonReentrant() {
        require(_guard == 1, "reentrant");
        _guard = 2;
        _;
        _guard = 1;
    }

    event Locked(
        uint256 indexed nonce,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint64 destChainId
    );
    event Refunded(uint256 indexed nonce, address recipient, uint256 amount);

    constructor(address token_) {
        require(token_ != address(0), "zero token");
        token = IERC20(token_);
        owner = msg.sender;
    }

    /// @notice Lock `amount` MUSD to be minted to `recipient` on `destChainId`.
    function lock(uint256 amount, uint64 destChainId, address recipient)
        external
        nonReentrant
        returns (uint256 id)
    {
        require(amount > 0, "amount zero");
        require(recipient != address(0), "recipient zero");
        require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        id = nextNonce++;
        locks[id] = Lock(msg.sender, recipient, amount, destChainId, false);
        emit Locked(id, msg.sender, recipient, amount, destChainId);
    }

    /// @notice Owner-only escape hatch: refund a lock to its sender if it was never delivered.
    function refund(uint256 id) external nonReentrant {
        require(msg.sender == owner, "not owner");
        Lock storage l = locks[id];
        require(l.amount > 0 && !l.refunded, "nothing to refund");
        l.refunded = true;
        require(token.transfer(l.sender, l.amount), "transfer failed");
        emit Refunded(id, l.sender, l.amount);
    }
}

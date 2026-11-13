// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Harvest-Proof Time Capsule
/// @notice One flow: seal a letter on the QoreChain Diana testnet (EVM chain
///         9800) so it can only be opened on or after a date you choose.
///         Sealing is one on-chain transaction. The chain stores only the
///         SHA-256 hash of the letter, never the letter itself, so the
///         letter stays hidden until its owner opens it. Opening checks
///         the hash and the date, then marks the capsule opened.
/// @dev This is a fresh Solidity contract written for the QoreChain
///      Developer Fest. It is not a copy of the NEAR Time-Locked Gifts
///      contract, which is a different chain and a different language.
///      The idea is inspired by Time-Locked Gifts, credited in README.md.
///      The quantum-safe part is the seal transaction itself: it is a
///      hybrid-signed transaction, carrying a classical secp256k1
///      signature and an ML-DSA-87 post-quantum signature, and the chain
///      checks both. The time lock is enforced by this contract, not by
///      encryption. The letter text is not encrypted here, it is kept off
///      chain until opening, so use sample text only, never a real secret.
///      No money, no token, no prize. Only testnet gas is spent.
contract TimeCapsule {
    /// @notice One sealed letter.
    struct Capsule {
        address creator;
        bytes32 letterHash;
        uint256 unlockTime;
        bool opened;
        string title;
    }

    /// @notice All capsules, by id, starting at 0.
    mapping(uint256 => Capsule) public capsules;

    /// @notice Total capsules sealed by everyone.
    uint256 public totalCapsules;

    /// @notice Emitted on every seal.
    event Sealed(
        uint256 indexed id,
        address indexed creator,
        uint256 unlockTime,
        bytes32 letterHash
    );

    /// @notice Emitted on every opening. The letter text is revealed here,
    ///         only after the unlock date has passed.
    event Opened(uint256 indexed id, address indexed creator, string letter);

    /// @notice Seal a letter. Pass the SHA-256 hash of the letter text,
    ///         the Unix time it may first be opened, and a short title.
    ///         The unlock time must be in the future.
    /// @return id The id of the new capsule.
    function sealCapsule(
        bytes32 letterHash,
        uint256 unlockTime,
        string calldata title
    ) external returns (uint256 id) {
        require(unlockTime > block.timestamp, "unlock time must be in the future");
        id = totalCapsules;
        capsules[id] = Capsule({
            creator: msg.sender,
            letterHash: letterHash,
            unlockTime: unlockTime,
            opened: false,
            title: title
        });
        totalCapsules += 1;
        emit Sealed(id, msg.sender, unlockTime, letterHash);
    }

    /// @notice Open a capsule. Only the creator can open it, only on or
    ///         after the unlock date, only once, and only with the exact
    ///         letter text that was sealed (its SHA-256 must match).
    function openCapsule(uint256 id, string calldata letter) external {
        Capsule storage capsule = capsules[id];
        require(capsule.creator != address(0), "no such capsule");
        require(msg.sender == capsule.creator, "only the creator can open it");
        require(!capsule.opened, "already opened");
        require(block.timestamp >= capsule.unlockTime, "too early to open");
        require(
            sha256(bytes(letter)) == capsule.letterHash,
            "letter does not match the sealed hash"
        );
        capsule.opened = true;
        emit Opened(id, msg.sender, letter);
    }

    /// @notice Read one capsule back: creator, letter hash, unlock time,
    ///         whether it is opened, and its title.
    function getCapsule(
        uint256 id
    )
        external
        view
        returns (
            address creator,
            bytes32 letterHash,
            uint256 unlockTime,
            bool opened,
            string memory title
        )
    {
        Capsule storage capsule = capsules[id];
        require(capsule.creator != address(0), "no such capsule");
        return (
            capsule.creator,
            capsule.letterHash,
            capsule.unlockTime,
            capsule.opened,
            capsule.title
        );
    }
}

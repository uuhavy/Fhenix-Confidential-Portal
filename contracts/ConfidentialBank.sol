// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@fhenixprotocol/contracts/FHE.sol";

contract ConfidentialBank {
    // Lưu trữ số dư dưới dạng số nguyên mã hóa 32-bit (euint32)
    mapping(address => euint32) private _balances;

    event EncryptedDeposit(address indexed user);
    event EncryptedTransfer(address indexed from, address indexed to);

    // Nạp tiền mã hóa: client gửi vào một ciphertext (inEuint32)
    function depositEncrypted(inEuint32 calldata encryptedAmount) external {
        euint32 amount = FHE.asEuint32(encryptedAmount);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        emit EncryptedDeposit(msg.sender);
    }

    // Chuyển tiền ẩn danh
    function transferEncrypted(address to, inEuint32 calldata encryptedAmount) external {
        euint32 amount = FHE.asEuint32(encryptedAmount);
        
        // Kiểm tra điều kiện ngầm không lộ dữ liệu
        ebool canTransfer = FHE.lte(amount, _balances[msg.sender]);
        euint32 transferAmount = FHE.select(canTransfer, amount, FHE.asEuint32(0));

        _balances[msg.sender] = FHE.sub(_balances[msg.sender], transferAmount);
        _balances[to] = FHE.add(_balances[to], transferAmount);

        emit EncryptedTransfer(msg.sender, to);
    }

    // Đọc số dư kín: yêu cầu chữ ký EIP-712 Permit để tạo sealed output
    function getBalance(Permission calldata permission) external view returns (string memory) {
        return FHE.sealoutput(_balances[msg.sender], permission.publicKey);
    }
}

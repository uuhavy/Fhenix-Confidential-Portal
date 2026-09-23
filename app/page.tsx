'use client';

import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { Shield, Lock, Eye, Send, ArrowDownToLine, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const FHENIX_CHAIN_ID = "0x7a31ff"; // 8008135 (Helium Testnet)

// ABI tối giản cho ConfidentialBank
const CONTRACT_ABI = [
  "function depositEncrypted(tuple(bytes data) encryptedAmount) external",
  "function transferEncrypted(address to, tuple(bytes data) encryptedAmount) external",
  "function getBalance(tuple(bytes publicKey, bytes signature) permission) external view returns (string)"
];

export default function ConfidentialPortal() {
  const [account, setAccount] = useState<string>('');
  const [fhenixClient, setFhenixClient] = useState<any>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [recipient, setRecipient] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 1. Kết nối ví MetaMask và khởi tạo Fhenix Client với dynamic import
  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        alert("Vui lòng cài đặt MetaMask!");
        return;
      }

      const browserProvider = new BrowserProvider((window as any).ethereum);
      
      // Chuyển sang mạng Fhenix Helium Testnet nếu cần
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: FHENIX_CHAIN_ID }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: FHENIX_CHAIN_ID,
              chainName: 'Fhenix Helium Testnet',
              rpcUrls: ['https://api.helium.fhenix.zone'],
              nativeCurrency: { name: 'tFHE', symbol: 'tFHE', decimals: 18 },
              blockExplorerUrls: ['https://explorer.helium.fhenix.zone'],
            }],
          });
        }
      }

      const accounts = await browserProvider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setProvider(browserProvider);

      // Dynamic import fhenixjs để tránh lỗi WebAssembly trong quá trình Next.js SSR
      setStatusMessage("Đang tải FHE Cryptographic Engine...");
      const { FhenixClient } = await import('fhenixjs');
      const client = new FhenixClient({ provider: browserProvider });
      setFhenixClient(client);
      setStatusMessage("FHE Engine sẵn sàng!");
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Lỗi kết nối: ${err.message}`);
    }
  };

  // 2. Nạp tiền ẩn danh (Client-Side Encryption qua fhenixjs)
  const handleDeposit = async () => {
    if (!fhenixClient || !provider || !account) return;
    setIsProcessing(true);
    setStatusMessage("Đang mã hóa số lượng (Client-side FHE)...");

    try {
      const signer = await provider.getSigner();
      const bankContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Mã hóa số nguyên sang inEuint32 ciphertext
      const encryptedValue = await fhenixClient.encrypt_uint32(Number(depositAmount));
      
      setStatusMessage("Đang gửi giao dịch nạp tiền mã hóa lên fhEVM...");
      const tx = await bankContract.depositEncrypted(encryptedValue);
      await tx.wait();

      setStatusMessage("Nạp tiền thành công vào Smart Contract FHE!");
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Lỗi nạp tiền: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Giải mã số dư bí mật bằng EIP-712 Permit
  const handleRevealBalance = async () => {
    if (!fhenixClient || !provider || !account) return;
    setIsProcessing(true);
    setStatusMessage("Đang tạo chữ ký EIP-712 Permit để xin giải mã...");

    try {
      const permit = await fhenixClient.generatePermit(CONTRACT_ADDRESS, provider);
      const signer = await provider.getSigner();
      const bankContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setStatusMessage("Đang truy xuất sealed output từ node...");
      const sealedResult = await bankContract.getBalance(permit);

      // Giải mã kết quả trả về bằng khóa riêng của permit
      const plaintext = fhenixClient.unseal(CONTRACT_ADDRESS, sealedResult);
      setBalance(plaintext.toString());
      setStatusMessage("Giải mã số dư thành công!");
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Lỗi đọc số dư: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
              Fhenix Confidential Portal
            </h1>
            <p className="text-xs text-gray-400">Powered by Fully Homomorphic Encryption (FHE)</p>
          </div>
        </div>

        <div>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-orange-600/20"
            >
              Kết nối ví MetaMask
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3.5 py-1.5 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono text-gray-300">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Số dư bảo mật */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Số dư on-chain bí mật</span>
            <Lock className="w-4 h-4 text-orange-400" />
          </div>

          <div className="my-6">
            {balance !== null ? (
              <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-2">
                <span>{balance}</span>
                <span className="text-sm font-normal text-orange-400">eTokens</span>
              </div>
            ) : (
              <div className="text-2xl font-mono text-gray-500 tracking-widest">••••••••</div>
            )}
            <p className="text-xs text-gray-400 mt-2">Dữ liệu trên blockchain luôn được mã hóa dạng `euint32`.</p>
          </div>

          <button
            onClick={handleRevealBalance}
            disabled={!account || isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium py-2.5 rounded-xl border border-gray-700 transition"
          >
            <Eye className="w-4 h-4" />
            Ký EIP-712 Permit để xem số dư
          </button>
        </div>

        {/* Card 2: Nạp tiền FHE */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Mã hóa & Nạp Token</span>
            <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Số lượng cần nạp</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="50"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={!account || isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow-lg shadow-orange-600/20 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Mã hóa & Gửi giao dịch
            </button>
          </div>
        </div>
      </main>

      {/* Thông báo trạng thái */}
      {statusMessage && (
        <div className="mt-8 bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <span className="text-xs text-gray-300 font-mono">{statusMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-600 border-t border-gray-800 pt-6">
        Fhenix Helium Testnet • Chain ID: 8008135 • tfhe.rs WebAssembly Engine
      </footer>
    </div>
  );
}

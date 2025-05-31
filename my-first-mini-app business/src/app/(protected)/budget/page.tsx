"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { ethers } from "ethers";

import PoolABI from "@/abis/maincontract.json";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useSession } from "next-auth/react";

type UserInfo = {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
};

export default function CryptoWalletApp() {

  const session = useSession();
  
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [txResult, setTxResult] = useState<Record<string, any> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // These could also be fetched on‐chain or via a hook, but we're hardcoding for now:
  const walletBalance = 3.45; 
  // const poolBalance = 12.8;
  const usdValue = 10214;
  const poolUsdValue = 38642;

  const ethfetchpriceurl = 'https://hermes.pyth.network/api/latest_price_feeds?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'

  const [ethfetchprice, setEthfetchprice] = useState(0);
  const [ethUsdValue, setEthUsdValue] = useState<number | null>(null);

  

  const CONTRACT_ADDRESS = "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99";
// 2) Create a read‐only provider (v6 syntax)
const provider = new ethers.JsonRpcProvider('https://worldchain-mainnet.g.alchemy.com/v2/14v_QWa7zUtZ_lXn4e0W7');

// 3) Instantiate contract with (address, ABI, provider)
const contract = new ethers.Contract(CONTRACT_ADDRESS, PoolABI, provider);  const [poolBalance, setPoolBalance] = useState(0);


  const handleSubmit = async () => {
    // Prevent double‐submits
    if (isSubmitting) return;

    // Validate amount
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a positive ETH amount.");
      return;
    }

    // Convert ETH string → Wei (string)
    let amountInWei: string;
    try {
      // amountInWei = ethers.parseEther(amount).toString();

      const amountBn = ethers.parseEther(amount);
// const amountHex = amountBn.toHexString(); // e.g. "0x2386F26FC10000"
amountInWei = "0x" + amountBn.toString(16);
    } catch (err) {
      console.error("Invalid amount:", err);
      alert("Invalid amount format.");
      return;
    }

    setIsSubmitting(true);
    setTxResult(null);

    try {
      if (mode === "deposit") {
        // depositFunds is payable and takes no args; `value` must be the wei amount
        const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: CONTRACT_ADDRESS,
              abi: PoolABI,
              functionName: "depositFunds",
              args: [],
              value: amountInWei,
            },
          ],
        });
        setTxResult(finalPayload);
      } else {
        // withdrawFunds(uint256) takes a single uint256 arg → amount in wei
        const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: CONTRACT_ADDRESS,
              abi: PoolABI,
              functionName: "withdrawFunds",
              args: [amountInWei],
            },
          ],
        });
        setTxResult(finalPayload);
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      alert("Transaction failed. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    if (!session?.data?.user?.id) return;

    const getPoolBalance = async () => {
      try {
        // @ts-ignore
        const balance = await contract.poolBalance(session.data.user.id);
        setPoolBalance(Number(balance));
      } catch (err) {
        console.error("Error fetching pool balance:", err);
      }
    };

    getPoolBalance();
  }, [contract, session?.data?.user?.id]);

  // 2) Once poolBalance is populated, fetch ETH price and calculate USD value
  useEffect(() => {
    if (poolBalance === null) return;

    fetch(ethfetchpriceurl)
      .then((response) => response.json())
      .then((data) => {
     
        
      const rawPrice: number = data[0].price.price;       
      const ethPrice: number = rawPrice / 1e8;         

      console.log("rawPrice (×10⁸):", rawPrice);
      console.log("ethPrice (USD/ETH):", ethPrice);

      const poolBalanceEthString = ethers.formatEther(poolBalance);
      const poolBalanceEthNumber = Number(poolBalanceEthString);    

      console.log("poolBalanceEthNumber (ETH):", poolBalanceEthNumber);

      const usdValue: number = poolBalanceEthNumber * ethPrice;

      setEthUsdValue(usdValue);
      })
      .catch((error) => console.error("Error fetching ETH price:", error));
  }, [poolBalance]);

  useEffect(() => {
    MiniKit.getUserInfo().then(setUserInfo).catch(console.error);
  }, []);


  // MiniKit.install("app_084f1b3748e598a42b970961a3b9fbd1")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Frame */}
      <div className="mx-auto bg-white min-h-screen relative">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🪙</span>
            <h1 className="text-2xl font-bold">Deposit & Withdraw</h1>
          </div>

          {userInfo && (
            <div>
              <p>Wallet Address: {session.data?.user.walletAddress || 'N/B'}</p>
              <p>Username: {userInfo.username || 'N/A'}</p>
              {/* <img src={userInfo.profilePictureUrl || ''} alt="Profile" /> */}
            </div>
          )}

          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="text-sm text-purple-600 font-medium mb-1">Wallet Balance</div>
              <div className="text-lg font-bold text-purple-900">{walletBalance} ETH</div>
              <div className="text-xs text-purple-600">${usdValue.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="text-sm text-green-600 font-medium mb-1"> Pool Balance</div>
              <div className="text-lg font-bold text-green-900">{ ethers.formatEther(poolBalance)  } ETH</div>
              <div className="text-xs text-green-600">
                {ethUsdValue !== null ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(ethUsdValue) : "Loading..."}
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("deposit")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === "deposit"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setMode("withdraw")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === "withdraw"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Withdraw
            </button>
          </div>

          {/* 3D Wallet Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-48 h-48 bg-gradient-to-br from-purple-200 to-purple-100 rounded-full flex items-center justify-center">
                {/* Floating coins */}
                <div className="absolute top-8 right-12">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    Ξ
                  </div>
                </div>
                <div className="absolute top-16 left-8">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    Ξ
                  </div>
                </div>
                <div className="absolute top-12 left-20">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    Ξ
                  </div>
                </div>

                {/* Wallet */}
                <div className="relative">
                  <div className="w-24 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-xl transform rotate-3">
                    <div className="absolute top-2 right-2 w-16 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
                  </div>
                  <div className="absolute -top-1 -left-1 w-24 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                    <div className="absolute top-2 right-2 w-16 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Action Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">
              {mode === "deposit" ? "Deposit to Pool" : "Withdraw from Pool"}
            </h2>

            <h3 className="text-lg font-semibold mb-3">
              Amount to {mode === "deposit" ? "Deposit" : "Withdraw"}
            </h3>

            <div className="relative mb-4">
              <div className="flex items-center border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 border-2 border-purple-600 rounded"></div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="border-0 text-lg font-medium p-0 focus-visible:ring-0"
                    max={mode === "deposit" ? walletBalance : poolBalance}
                  />
                </div>
                <span className="text-gray-600 font-medium">ETH</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              {mode === "deposit"
                ? "Enter the amount of ETH you want to deposit into the on‐chain pool. Funds will be locked until you choose to withdraw."
                : "Enter the amount up to your current pool balance. The withdrawal will be processed immediately."}
            </p>

            <Button
              onClick={handleSubmit}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold rounded-xl"
              disabled={
                !amount ||
                Number.parseFloat(amount) <= 0 ||
                isSubmitting
              }
            >
              {isSubmitting
                ? mode === "deposit"
                  ? "Depositing..."
                  : "Withdrawing..."
                : mode === "deposit"
                ? "Deposit"
                : "Withdraw"}
            </Button>
          </div>

          {/* Display transaction result */}
          {txResult && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">
                Transaction Successful!
              </h3>
              <pre className="text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(txResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Pool Stats */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Pool Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Pool Size</div>
                <div className="font-bold text-gray-800">1,247.8 ETH</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Money Spent</div>
                <div className="font-bold text-green-600">5</div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mb-20">
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Minimum deposit: 0.01 ETH</p>
              <p>• Withdrawal fee: 0.1%</p>
              <p>• Rewards distributed daily</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

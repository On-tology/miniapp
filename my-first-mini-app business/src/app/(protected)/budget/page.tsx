"use client"

import { useState } from "react"
import { CheckCircle, FileText, BarChart3, User } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"

export default function CryptoWalletApp() {
  const [amount, setAmount] = useState("")
  const [activeTab, setActiveTab] = useState("tasks")
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit")

  const walletBalance = 3.45
  const poolBalance = 12.8
  const usdValue = 10214
  const poolUsdValue = 38642

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Frame */}
      <div className="mx-auto bg-white min-h-screen relative">
        {/* Status Bar */}


        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🪙</span>
            <h1 className="text-2xl font-bold">Deposit a Withdraw</h1>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="text-sm text-purple-600 font-medium mb-1">Wallet Balance</div>
              <div className="text-lg font-bold text-purple-900">{walletBalance} ETH</div>
              <div className="text-xs text-purple-600">${usdValue.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="text-sm text-green-600 font-medium mb-1">Pool Balance</div>
              <div className="text-lg font-bold text-green-900">{poolBalance} ETH</div>
              <div className="text-xs text-green-600">${poolUsdValue.toLocaleString()}</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("deposit")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === "deposit" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setMode("withdraw")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === "withdraw" ? "bg-white text-purple-600 shadow-sm" : "text-gray-600"
              }`}
            >
              Withdraw
            </button>
          </div>

          {/* 3D Wallet Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Background circle */}
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
            <h2 className="text-xl font-bold mb-4">{mode === "deposit" ? "Deposit to Pool" : "Withdraw from Pool"}</h2>

            <h3 className="text-lg font-semibold mb-3">Amount to {mode === "deposit" ? "Deposit" : "Withdraw"}</h3>

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
                ? "Enter the amount of ETH you want to deposit into the reward pool. Funds will be locked until you choose to withdraw."
                : "Enter the amount up to your current pool balance. The transaction will be processed immediately."}
            </p>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold rounded-xl"
              disabled={!amount || Number.parseFloat(amount) <= 0}
            >
              {mode === "deposit" ? "Deposit" : "Withdraw"}
            </Button>
          </div>

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
  )
}

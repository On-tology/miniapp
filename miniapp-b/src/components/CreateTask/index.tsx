"use client";

import { useState, ChangeEvent } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import SimpleABI from "@/abis/maincontract.json";
import Button from "@/components/ui/button"; // (adjust path if needed)
import { ethers } from "ethers";

export default function CreateTask() {
  const [showForm, setShowForm] = useState(false);
  const [taskType, setTaskType] = useState<"ranking" | "classification" | "">(
    ""
  );
  const [imageURI, setImageURI] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [txResult, setTxResult] =
    useState<Record<string, any> | null>(null);
  const [reward, setReward] = useState("");

  // Whenever the user picks an image, we store a local URL (or you could
  // upload it to IPFS here and store that URL instead).
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageURI(url);
  };

  const handleSubmit = async () => {
    if (!taskType || !imageURI) {
      alert("Please select task type and upload an image.");
      return;
    }

    // Build the arguments for the contract call.
    // If it's "classification", we pass the two options in an array.
    // If it's "ranking", we pass an empty array for options.
    const optionsArray =
      taskType === "classification" ? [optionA, optionB] : [];

    try {
        const { commandPayload, finalPayload } =
        await MiniKit.commandsAsync.sendTransaction({
          transaction: [
            {
              address: "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99",
              abi: SimpleABI,
              functionName: "postRankingTask",
              args: [
                "how would u rate this hackathon?",
                ethers.parseEther("0.0001"), // uint256 in wei
              ],
            },
          ],
        });

      setTxResult(finalPayload);
      console.log("Blockchain response:", finalPayload);
    } catch (err) {
      console.error("Error sending transaction:", err);
      alert("Failed to send transaction. See console for details.");
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center m-auto">
      {/* Step 1: “Create New Task” button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md mx-auto"
        >
          Create New Task
        </button>
      )}

      {/* Step 2+: the form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mt-4 w-full">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Create New Task
          </h2>

          {/* 2. Choose Ranking vs. Classification */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setTaskType("ranking");
                // Reset classification fields if switching away:
                setOptionA("");
                setOptionB("");
              }}
              className={`flex-1 py-2 rounded-lg text-center font-medium transition-colors ${
                taskType === "ranking"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              Ranking
            </button>

            <button
              onClick={() => setTaskType("classification")}
              className={`flex-1 py-2 rounded-lg text-center font-medium transition-colors ${
                taskType === "classification"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              Classification
            </button>
          </div>

          {/* 3. Unlock (upload) image */}
          {taskType && (
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Unlock Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-700
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-indigo-50 file:text-indigo-700
                           hover:file:bg-indigo-100"
              />

<div>
                <label className="block mt-1 font-medium text-gray-700 dark:text-gray-300">
                  Reward
                </label>
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0.1.."
                />
              </div>

              {/* Preview of the uploaded image */}
              {imageURI && (
                <img
                  src={imageURI}
                  alt="Preview"
                  className="mt-4 max-h-48 object-contain rounded-lg border"
                />
              )}
            </div>
          )}

          {/* 4. If “Classification” → show two text inputs */}
          {taskType === "classification" && (
            <div className="mb-6">
              <div className="mb-4">
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                  Option A
                </label>
                <input
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g. 'Cat'"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                  Option B
                </label>
                <input
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g. 'Dog'"
                />
              </div>
              
            </div>
          )}

          {/* 5. Submit button */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-[#6c3ce9] hover:bg-[#5b32c7] text-white rounded-lg transition-colors"
          >
            Submit Task
          </button>

          {/* 6. Once tx goes through, display the result */}
          {txResult && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-md border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Task sent successfully!
              </h3>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(txResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

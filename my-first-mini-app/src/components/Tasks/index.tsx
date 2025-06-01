"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Progress from "@/components/ui/progress";
import {
  FileEdit,
  ClipboardList,
  ListOrdered,
  Star,
  StarHalfIcon,
} from "lucide-react";
import { ethers } from "ethers";
import {
  MiniAppSendTransactionErrorPayload,
  MiniAppSendTransactionSuccessPayload,
  MiniKit,
} from "@worldcoin/minikit-js";
import SimpleABI from "@/abis/maincontract.json";
import { useSession } from "next-auth/react";

type OnChainTask = {
  id: number;
  title: string;
  type: "Ranking" | "Classification";
  reward: string;
  time: string;
  progressValue: number;
  instructions: string;
  buttonLabel: string;
  icon: any;
  description: string;

  worker: string;
  statusNum: number;
};

export function Tasks() {
  // 1) State for all on‐chain tasks
  const [tasks, setTasks] = useState<OnChainTask[]>([]);

  // 2) Get user's address from session (assumes user.id is the wallet address)
  const session = useSession();
  const userAddress = session.data?.user.id?.toLowerCase() || "";
  const [choices, setChoices] = useState<string[]>([]);

  // 3) Which card is expanded
  const [activeTaskId, setActiveTaskId] = useState<number | null>(1);

  // 4) MiniKit payload (success or error)
  const [
    txPayload,
    setTxPayload,
  ] = useState<MiniAppSendTransactionSuccessPayload | MiniAppSendTransactionErrorPayload | null>(
    null
  );

  // 5) The task the user has accepted/continued (for overlay)
  const [acceptedTask, setAcceptedTask] = useState<{
    id: number;
    type: "Ranking" | "Classification";
    description: string;
  } | null>(null);

  // 6) Rating slider value (0–10) for Ranking tasks
  const [rankingValue, setRankingValue] = useState<number>(5);

  // 7) Selected option index (0–3) for Classification tasks, or null if none chosen
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  // 8) On‐chain setup
  const CONTRACT_ADDRESS = "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99";
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/v2/14v_QWa7zUtZ_lXn4e0W7"
  );
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SimpleABI, provider);

  // 9) Whenever acceptedTask changes (i.e. overlay opens), reset slider and selection
  useEffect(() => {
    if (acceptedTask) {
      setRankingValue(5);
      setSelectedOptionIndex(null);
    }
  }, [acceptedTask]);

  // 10) Fetch on‐chain tasks once the component mounts, or when userAddress changes
  useEffect(() => {
    const fetchOnChainTasks = async () => {
      try {
        const rawTasks: any[] = await contract.getAllTasks();
        const parsed: OnChainTask[] = rawTasks.map((tup: any) => {
          const id = Number(tup[0]);
          const description: string = tup[3];
          const rewardWei = tup[2];
          const rewardHuman = `${ethers.formatEther(rewardWei)} ETH`;
          const statusNum = Number(tup[5]);
          let progressValue = 0;
          if (statusNum === 1) progressValue = 50;
          else if (statusNum === 2) progressValue = 100;
          const hasSubmission: boolean = tup[7];
          const instructions = hasSubmission
            ? "Submission available. Click to view."
            : "No submission yet. Waiting on worker.";
          const taskTypeNum = Number(tup[4]);
          const timePlaceholder = taskTypeNum === 0 ? "3 min" : "2 min";

          // Grab the on‐chain worker address
          const workerAddress: string = (tup[6] || "").toLowerCase();

          // Determine if this is already assigned to current user
          let buttonLabel = "Accept";
          if (userAddress && userAddress === workerAddress) {
            buttonLabel = "Continue Task";
          }

          return {
            id,
            title: `Task #${id}`,
            // NOTE: mapping depends on your contract: here I assume taskTypeNum===1 → Ranking
            type: taskTypeNum === 1 ? "Ranking" : "Classification",
            reward: rewardHuman,
            time: timePlaceholder,
            progressValue,
            instructions,
            buttonLabel,
            icon:
              taskTypeNum === 0 ? (
                <FileEdit className="w-5 h-5 text-white" />
              ) : (
                <ClipboardList className="w-5 h-5 text-white" />
              ),
            description,
            worker: workerAddress,
            statusNum,
          };
        });

        setTasks(parsed);
      } catch (err) {
        console.error("Error fetching on-chain tasks:", err);
      }
    };

    fetchOnChainTasks();
  }, [userAddress]);

  // 11) Expand/collapse a card
  const handleToggle = (id: number) => {
    setActiveTaskId((prev) => (prev === id ? null : id));
  };

  // 12) Called when clicking “Accept” or “Continue Task”
  const sendTransaction = async (task: OnChainTask) => {
    try {
      if (task.buttonLabel === "Accept") {
        const { commandPayload, finalPayload } =
          await MiniKit.commandsAsync.sendTransaction({
            transaction: [
              {
                address: CONTRACT_ADDRESS,
                abi: SimpleABI,
                functionName: "acceptTask",
                args: [task.id],
              },
            ],
          });

        setTxPayload(finalPayload);
        const isError = (finalPayload as any).status === "error";
        if (!isError) {
          // Open the overlay
          setAcceptedTask({
            id: task.id,
            type: task.type,
            description: task.description,
          });
        } else {
          console.error("Transaction failed:", (finalPayload as any).error);
        }
      } else {
        // Just continue
        setAcceptedTask({
          id: task.id,
          type: task.type,
          description: task.description,
        });
      }
    } catch (err) {
      console.error("sendTransaction threw an unexpected error:", err);
    }
  };

  useEffect(() => {
    if (!acceptedTask) {
      // If overlay closed, clear previous choices and selection.
      setChoices([]);
      setSelectedOptionIndex(null);
      return;
    }

    // Only fetch choices if this is a Classification task:
    if (acceptedTask.type === "Classification") {
      const fetchChoices = async () => {
        try {
          // Call getChoices(taskId) on-chain. Assume it returns string[].
          const raw: string[] = await contract.getChoices(acceptedTask.id);
          // If needed, you can transform raw (e.g. decode bytes) here. We assume strings.
          setChoices(raw);
        } catch (err) {
          console.error("Error fetching choices:", err);
        }
      };
      fetchChoices();
    }
  }, [acceptedTask]);


  // 13) Render the full‐screen overlay if a task is accepted/continued
  const renderFullScreenView = () => {
    if (!acceptedTask) return null;

    return (
      <div
        className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center px-4"
        style={{ backdropFilter: "blur(4px)" }}
      >
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-8 relative">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            onClick={() => setAcceptedTask(null)}
          >
            ✕
          </button>

          {/* Header & description */}
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Task #{acceptedTask.id}:{" "}
            {acceptedTask.type === "Ranking" ? "Ranking" : "Classification"}
          </h2>
        <img src={`https://backend-production-bb1f.up.railway.app/files/${acceptedTask.description}`} alt="Task Image" />


          {/* RANKING UI: slider 0–10 */}
          {acceptedTask.type === "Ranking" && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Drag the slider to choose a rating (0 to 10):
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={rankingValue}
                  onChange={(e) => setRankingValue(Number(e.target.value))}
                  className="w-full"
                />
                <span className="w-10 text-right text-gray-900 dark:text-gray-100 font-semibold">
                  {rankingValue}
                </span>
              </div>
              <button
                className="w-full bg-[#6c3ce9] hover:bg-[#5b32c7] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed] text-white font-semibold py-3 rounded-lg"
                onClick={async () => {
                  console.log("Submitted ranking value:", rankingValue);
                  console.log(acceptedTask.id)
                  console.log(rankingValue)

                  if(acceptedTask.type == "Ranking") {
                    const { commandPayload, finalPayload } =
                    await MiniKit.commandsAsync.sendTransaction({
                        transaction: [
                        {
                            address: CONTRACT_ADDRESS,
                            abi: SimpleABI,
                            functionName: "submitRankingWork",
                            args: [acceptedTask.id, rankingValue],
                        },
                        ],
                    });
                    

                    console.log('finalPayload', finalPayload);
                  } else {
                    const { commandPayload, finalPayload } =
                    await MiniKit.commandsAsync.sendTransaction({
                        transaction: [
                        {
                            address: CONTRACT_ADDRESS,
                            abi: SimpleABI,
                            functionName: "submitClassificationWork",
                            args: [acceptedTask.id, rankingValue],
                        },
                        ],
                    });
                  }

                }}
              >
                Submit Ranking
              </button>
            </div>
          )}

          {/* CLASSIFICATION UI: clickable options */}
          {acceptedTask.type === "Classification" && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Choose one of the following options:
              </h3>



              <div className="grid grid-cols-2 gap-4 mb-4">
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOptionIndex(index)}
                    className={`flex items-center p-4 border rounded-lg transition
                      ${
                        selectedOptionIndex === index
                          ? "border-blue-500 bg-blue-100 dark:bg-blue-900"
                          : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                      }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              

              <button
                disabled={selectedOptionIndex === null}
                className={`w-full py-3 rounded-lg font-semibold transition
                  ${
                    selectedOptionIndex === null
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      : "bg-[#6c3ce9] hover:bg-[#5b32c7] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed] text-white"
                  }
                `}
                onClick={async () => {
                    const { commandPayload, finalPayload } =
                    await MiniKit.commandsAsync.sendTransaction({
                        transaction: [
                        {
                            address: CONTRACT_ADDRESS,
                            abi: SimpleABI,
                            functionName: "submitClassificationWork",
                            args: [acceptedTask.id, selectedOptionIndex],
                        },
                        ],
                    });
                  console.log("Submitted classification index:", selectedOptionIndex);
                }}
              >
                Submit Classification
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full relative">
      {/* If a task is accepted or continued, show the overlay */}
      {acceptedTask && renderFullScreenView()}

      <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900 h-full">
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;

          return (
            <Card
              key={task.id}
              className="mb-4 p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div
                className="flex items-center gap-4 cursor-pointer select-none"
                onClick={() => handleToggle(task.id)}
              >
                <div className="bg-[#6c3ce9] dark:bg-[#8b5cf6] rounded-full p-3 flex-shrink-0">
                  {task.icon}
                </div>
                {/* <img src={`https://backend-production-bb1f.up.railway.app/files/${task.description}`} alt="Task Image" className="w-10 h-10" /> */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {task.type}
                  </p>
                  <div className="flex justify-between mt-1">
                    <span className="text-lg text-gray-600 dark:text-gray-400">
                      {task.reward}
                    </span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">
                      {task.time}
                    </span>
                  </div>
                </div>
                {/* Chevron icon */}
                <svg
                  className={`w-6 h-6 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                    isActive ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Expandable area */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isActive ? "max-h-80" : "max-h-0"
                }`}
              >
                {/* Progress bar */}
                {typeof task.progressValue === "number" && task.progressValue > 0 && (
                  <div className="mt-4">
                    <Progress value={task.progressValue} className="h-2" />
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-4">
                  <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    Instructions
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {task.instructions}
                  </p>
                </div>

                {/* Button */}
                <div className="mt-4">
                  <button
                    onClick={() => sendTransaction(task)}
                    className={`w-full text-lg py-6 text-white rounded-lg h-12 flex items-center justify-center
                      ${
                        task.buttonLabel === "Continue Task"
                          ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          : "bg-[#6c3ce9] hover:bg-[#5b32c7] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed]"
                      }
                    `}
                  >
                    {task.buttonLabel}
                  </button>
                  {txPayload && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(txPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

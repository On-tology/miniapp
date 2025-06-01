"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Progress from "@/components/ui/progress";
import { FileEdit, ClipboardList, StarHalfIcon, Star, ListOrdered } from "lucide-react";
import { ethers } from "ethers";
//import Button from "../ui/button"
import {
  MiniAppSendTransactionErrorPayload,
  MiniAppSendTransactionSuccessPayload,
  MiniKit,
} from "@worldcoin/minikit-js";
import SimpleABI from "@/abis/maincontract.json";

export function Tasks() {
  // Track which task is currently expanded (by id). Initialize to 1 so the first card is expanded by default.
  const [activeTaskId, setActiveTaskId] = useState<number | null>(1);

 const [tasks, setTasks] = useState<any[]>([]);

  const CONTRACT_ADDRESS = "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99";
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/v2/14v_QWa7zUtZ_lXn4e0W7"
  );
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SimpleABI, provider);


   // 2) Fetch on‐chain tasks once on mount
   useEffect(() => {
    const fetchOnChainTasks = async () => {
      try {
        // Assume getAllTasks() returns something like:
        // [ [ BigNumber id,
        //     address requester,
        //     BigNumber reward,
        //     string description,
        //     BigNumber taskType,
        //     BigNumber status,
        //     address worker,
        //     boolean hasSubmission,
        //     BigNumber submissionIndex,
        //     BigNumber ratingScaled ],
        //   … more tuples … ]
        const rawTasks: any[] = await contract.getAllTasks();
        console.log('rawTasks', rawTasks);
        // Map each tuple → OnChainTask
        const parsed = rawTasks.map((tup: any) => {
          // 0: id (BigNumberish)
          const id = Number(tup[0]);

          // 3: description as our "title"
          const description: string = tup[3];

          // 2: reward (BigNumberish). We assume it's in wei; use formatEther to get "X.WLD"
          const rewardWei = Number(tup[2]);
          const rewardHuman = `${ethers.formatEther(rewardWei)} ETH`;

          // 5: status → we derive a "progressValue" as an example
          //    (this is arbitrary—feel free to define your own logic)
          const statusNum = Number(tup[5]);
          // e.g. 0 = not started (0%), 1 = in progress (50%), 2 = done (100%)
          let progressValue = 0;
          if (statusNum === 1) progressValue = 50;
          else if (statusNum === 2) progressValue = 100;

          // 7: hasSubmission → if true, we can say "instructions" = "View submission on‐chain"
          const hasSubmission: boolean = tup[7];
          const instructions = hasSubmission
            ? "Submission available. Click to view."
            : "No submission yet. Waiting on worker.";

          // 4: taskType (BigNumberish)—we can ignore or use it to pick an icon/color
          const taskTypeNum = Number(tup[4]);

          // For the "time" field, on‐chain doesn't store explicit time, so we just put a placeholder
          const timePlaceholder = taskTypeNum === 0 ? "3 min" : "2 min";

          // Button label could change based on status
          let buttonLabel = "Accept";
          

          return {
            id,
            title: `Task #${id}`,
            type : taskTypeNum === 0 ? "Ranking" : "Classification",
            reward: rewardHuman,
            time: timePlaceholder,
            progressValue,
            instructions,
            buttonLabel,
            icon: taskTypeNum === 0 ? <FileEdit className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />,
          };
        });

        setTasks(parsed);
      } catch (err) {
        console.error("Error fetching on‐chain tasks:", err);
      }
    };

    fetchOnChainTasks();
  }, []);


  const handleToggle = (id: number) => {
    setActiveTaskId((prev) => (prev === id ? null : id));
  };

  const [a, setA] = useState<
    | MiniAppSendTransactionSuccessPayload
    | MiniAppSendTransactionErrorPayload
    | null
  >(null);

  const sendTransaction = async (id : number) => {

    console.log('id', id);
    const {
      commandPayload,
      finalPayload,
    } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99",
          abi: SimpleABI,
          functionName: "acceptTask",
          args: [id],
        },
      ],
    });
    console.log("finalPayload", finalPayload, commandPayload);
    setA(finalPayload);
  };

  return (
    <div className="h-full">
      <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900 h-full">
        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;

          return (
            <Card
              key={task.id}
              className="mb-4 p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              {/* Header: always visible, clickable */}
              <div
                className="flex items-center gap-4 cursor-pointer select-none"
                onClick={() => handleToggle(task.id)}
              >
                <div className="bg-[#6c3ce9] dark:bg-[#8b5cf6] rounded-full p-3 flex-shrink-0">
                  {task.icon}
                </div>
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
                {/* Chevron/down arrow to indicate expand/collapse */}
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

              {/* Expandable content */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isActive ? "max-h-80" : "max-h-0"
                }`}
              >
                {/* Progress bar (only if defined and > 0) */}
                {typeof task.progressValue === "number" &&
                  task.progressValue > 0 && (
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
                    onClick={() => sendTransaction(task.id)}
                    className="w-full bg-[#6c3ce9] hover:bg-[#5b32c7] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed] text-lg py-6 text-white rounded-lg h-12 flex items-center justify-center"
                  >
                    {task.buttonLabel}
                  </button>
                  {a && <div>{JSON.stringify(a)}</div>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

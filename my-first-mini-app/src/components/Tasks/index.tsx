"use client";

import { useState } from "react";
import Card from "@/components/ui/card";
import Progress from "@/components/ui/progress";
import { FileEdit, ClipboardList } from "lucide-react";
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

  // Define your tasks’ data, including any content you want to show when expanded.
  const tasks = [
    {
      id: 1,
      title: "Evaluate Chatbot Responses",
      reward: "0,20 WLD",
      time: "3 min",
      // Icon as JSX
      icon: (
        <div className="w-8 h-8 text-white">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
      ),
      progressValue: 30,
      instructions: `Rate each pair of chatbot responses based on helpfulness. Select the more appropriate answer for the given query.`,
      // If you want a button label or any other JSX for expanded content, you can include it here
      buttonLabel: "Accept",
    },
    {
      id: 2,
      title: "Correct Bounding Boxes",
      reward: "0,15 WLD",
      time: "2 min",
      icon: <FileEdit className="w-5 h-5 text-white" />,
      progressValue: 0, // or whatever you prefer
      instructions: `Adjust bounding boxes to match the target objects in the image. Ensure each box tightly encloses the object of interest.`,
      buttonLabel: "Submit",
    },
    {
      id: 3,
      title: "Take a Short Survey",
      reward: "0,10 WLD",
      time: "4 min",
      icon: <ClipboardList className="w-5 h-5 text-white" />,
      progressValue: 0, // or whatever you prefer
      instructions: `Answer a few quick questions about your experience. Your feedback helps us improve!`,
      buttonLabel: "Start Survey",
    },
  ];

  const handleToggle = (id: number) => {
    setActiveTaskId((prev) => (prev === id ? null : id));
  };

  const [a, setA] = useState<
    | MiniAppSendTransactionSuccessPayload
    | MiniAppSendTransactionErrorPayload
    | null
  >(null);

  const sendTransaction = async () => {
    const {
      commandPayload,
      finalPayload,
    } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99",
          abi: SimpleABI,
          functionName: "getTotalTasks",
          args: [],
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
                    onClick={sendTransaction}
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

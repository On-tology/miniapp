// pages/manage-tasks.tsx
"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Star, StarOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { ethers, BigNumberish } from "ethers";
import PoolABI from "@/abis/maincontract.json";

type TaskItem = {
  id: number;
  title: string;
  status: "Pending" | "In Review" | "Completed";
  answer: string;
  rating: number; // 1–5 stars
  approved: boolean;
};

export default function ManageTasksPage() {
  const session = useSession();

  const [tasks, setTasks] = useState<TaskItem[]>([
    // You can keep these placeholder entries if you want, or start with []:
    {
      id: 101,
      title: "Translate UI Strings",
      status: "In Review",
      answer: "Here are the translated strings in French…",
      rating: 0,
      approved: false,
    },
    {
      id: 102,
      title: "Annotate Dataset",
      status: "Pending",
      answer: "",
      rating: 0,
      approved: false,
    },
    {
      id: 103,
      title: "Review Privacy Policy",
      status: "Completed",
      answer: "I’ve read through and left comments inline…",
      rating: 4,
      approved: false,
    },
  ]);

  const CONTRACT_ADDRESS = "0x13A037C20a3762ce151032Eb86D2DEd78c8c5E99";
  const provider = new ethers.JsonRpcProvider(
    "https://worldchain-mainnet.g.alchemy.com/v2/14v_QWa7zUtZ_lXn4e0W7"
  );
  const contract = new ethers.Contract(CONTRACT_ADDRESS, PoolABI, provider);

  useEffect(() => {
    if (!session.data?.user) return;

    const fetchTasks = async () => {
      try {
        // Assume getAllTasks() returns an array of Task structs, e.g.:
        // [ [BigNumber id, string requester, BigNumber reward, string description,
        //    BigNumber taskType, BigNumber status, string worker, boolean hasSubmission,
        //    BigNumber submissionIndex, BigNumber ratingScaled], ... ]
        const raw: any[] = await contract.getAllTasks();

        // Map each “tuple” into our TaskItem type
        const parsed: TaskItem[] = await Promise.all(raw.map(async (tup: any) => {
          // Destructure by index (adjust if your struct order is different)
          
          const id: number = Number(tup[0]);
          const description: string = tup[3];
          const statusNum: number = Number(tup[5]);
          const hasSubmission: boolean = tup[7];
          const ratingScaled: number = Number(tup[9]);



          // Convert numeric status → string union
          let statusStr: "Pending" | "In Review" | "Completed" = "Pending";
          if (statusNum === 0) statusStr = "Pending";
          else if (statusNum === 1) statusStr = "In Review";
          else if (statusNum === 2) statusStr = "Completed";

          // Convert ratingScaled (e.g. if scaled 0–5) → a 1–5 star rating
          // (If your contract stores ratingScaled differently, tweak this.)
          const rating = Math.min(Math.max(ratingScaled, 0), 5);

          // If there is a submission, you probably want to fetch the actual text,
          // but for now we’ll just show a placeholder.
          
          let answer = hasSubmission
            ? "Submission received (view on‐chain or via API)."
            : "";

            if (hasSubmission) {
              const answers = await contract.getSubmittedWork(id);
              // answer = answers[];
              let type  = Number(tup[4])  === 1 ? "Ranking" : "Classification"
              console.log('type', type);
               if (type === "Ranking") {
                answer = answers[3].toString()
               } else {
                let options = await contract.getChoices(id)
                answer = options[answers[1]].toString()
               }
              console.log('answer', answers);
            }

          return {
            id,
            title: description || `Task #${id}`, // use description as title
            status: statusStr,
            answer,
            rating,
            approved: statusStr === "Completed", // mark “approved” once completed
          };
        }));

        setTasks(parsed);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks();
  }, [session.data]);

  const handleRatingChange = (taskId: number, newRating: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              rating: newRating,
            }
          : t
      )
    );
    // TODO: call your contract or API to persist new rating
  };

  const handleApprove = (taskId: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              approved: true,
              status: "Completed",
            }
          : t
      )
    );
    // TODO: dispatch an on‐chain or API call to mark as approved
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto bg-white min-h-screen relative">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📋</span>
            <h1 className="text-2xl font-bold">Manage Your Tasks</h1>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="p-4 shadow-sm bg-white rounded-xl border border-gray-200"
              >
                <div className="flex items-center flex-col-reverse gap-2 justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                     <img src={`https://backend-production-bb1f.up.railway.app/files/${task.title}`} alt="" /> 
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      task.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : task.status === "In Review"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                {/* Answer / Content */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">
                    Answer:
                  </h3>
                  <div
                    className={`text-gray-700 p-3 border rounded-lg ${
                      task.answer
                        ? "bg-gray-50"
                        : "bg-gray-100 italic text-gray-400"
                    }`}
                  >
                    {task.answer || "No answer submitted yet."}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-600 mr-4">
                    Rating:
                  </h3>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(task.id, star)}
                        className="focus:outline-none"
                      >
                        {star <= task.rating ? (
                          <Star className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Approve Button */}
                <div className="flex items-center justify-between">
                  {task.approved ? (
                    <span className="text-green-700 font-semibold">
                      Approved ✔
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleApprove(task.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
                    >
                      Approve Work
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom spacing */}
          <div className="mb-20"></div>
        </div>
      </div>
    </div>
  );
}

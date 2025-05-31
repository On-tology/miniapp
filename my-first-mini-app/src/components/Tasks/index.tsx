import Card from "@/components/ui/card"

import Progress from "@/components/ui/progress"
import {  FileEdit, ClipboardList } from "lucide-react"
import Button from "../ui/button"

console.log(">>> Tasks imports:", { Card, Progress, Button })




export function Tasks() {
    return (
       <div>
        {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
        {/* Task 1 */}
        <Card className="mb-4 p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4 ">
            <div className="bg-[#6c3ce9] dark:bg-[#8b5cf6] rounded-full p-3 flex-shrink-0">
              <div className="w-8 h-8 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Evaluate Chatbot Responses</h3>
              <div className="flex justify-between mt-1">
                <span className="text-lg text-gray-600 dark:text-gray-400">0,20 WLD</span>
                <span className="text-lg text-gray-600 dark:text-gray-400">3 min</span>
              </div>
            </div>
          </div>

          <Progress value={30} className="h-2 " />

          <div className="">
            <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Instructions</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Rate each pair of chatbot responses based on helpfulness. Select the more appropriate answer for the given
              query.
            </p>
          </div>

        <button className="w-full bg-[#6c3ce9] hover:bg-[#5b32c7] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed] text-lg py-6 text-white rounded-lg h-12 flex items-center justify-center">
            Accept
        </button>
          {/* <Button className="w-full bg-[#6c3ce9] hover:bg-[#5b32c7] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed] text-lg py-6">
            Accept
          </Button> */}
        </Card>

        {/* Task 2 */}
        <Card className="mb-4 p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex  gap-4 flex items-center">
            <div className="bg-[#6c3ce9] dark:bg-[#8b5cf6] rounded-full p-3 flex-shrink-0">
              <FileEdit className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Correct Bounding Boxes</h3>
              <div className="flex justify-between mt-1">
                <span className="text-lg text-gray-600 dark:text-gray-400">0,15 WLD</span>
                <span className="text-lg text-gray-600 dark:text-gray-400">2 min</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Task 3 */}
        <Card className="mb-4 p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex  gap-4 flex items-center">
        <div className="bg-[#6c3ce9] dark:bg-[#8b5cf6] rounded-full p-3 flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Take a Short Survey</h3>
              <div className="flex justify-between mt-1">
                <span className="text-lg text-gray-600 dark:text-gray-400">0,10 WLD</span>
                <span className="text-lg text-gray-600 dark:text-gray-400">4 min</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
       </div>
    )
}
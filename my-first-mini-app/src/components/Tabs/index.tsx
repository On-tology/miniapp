"use client";

import { Tabs as TabsRoot, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TabsSelector() {
  return (
    <div className="bg-indigo-600 dark:bg-indigo-800 px-6  rounded-xl shadow-lg max-w-2xl mx-auto w-full">
      <TabsRoot defaultValue="ai-eval" className="w-full">
        {/* ─── Tab List ─────────────────────────────────────────── */}
        <TabsList className="w-full bg-white dark:bg-gray-700 rounded-full h-12 flex p-1 shadow-inner">
          <TabsTrigger
            value="ai-eval"
            className="
              flex-1 text-center 
              rounded-full
              py-2
              font-medium
              text-gray-700 dark:text-gray-300
              data-[state=active]:bg-[#6c3ce9]
              data-[state=active]:text-white
              data-[state=active]:shadow-lg
              transition-colors duration-200
            "
          >
            AI Eval
          </TabsTrigger>

          <TabsTrigger
            value="image-qc"
            className="
              flex-1 text-center 
              rounded-full
              py-2
              font-medium
              text-gray-700 dark:text-gray-300
              data-[state=active]:bg-[#6c3ce9]
              data-[state=active]:text-white
              data-[state=active]:shadow-lg
              transition-colors duration-200
            "
          >
            Image QC
          </TabsTrigger>

          <TabsTrigger
            value="surveys"
            className="
              flex-1 text-center 
              rounded-full
              py-2
              font-medium
              text-gray-700 dark:text-gray-300
              data-[state=active]:bg-[#6c3ce9]
              data-[state=active]:text-white
              data-[state=active]:shadow-lg
              transition-colors duration-200
            "
          >
            Surveys
          </TabsTrigger>
        </TabsList>
      </TabsRoot>
    </div>
  );
}

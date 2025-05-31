import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { Pay } from '@/components/Pay';
import { Transaction } from '@/components/Transaction';
import { UserInfo } from '@/components/UserInfo';
import { Verify } from '@/components/Verify';
import { ViewPermissions } from '@/components/ViewPermissions';
import  DebugTabs from '@/components/Tabs';

// import { Marble, Tabs, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckCircle } from 'iconoir-react';
import {Tasks} from '@/components/Tasks';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        {/* <h1>yo</h1> */}
      <div className="bg-[#6c3ce9] dark:bg-[#5b32c7] text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-full p-1">
            <CheckCircle className="h-6 w-6 text-[#6c3ce9] dark:text-[#8b5cf6]" />
          </div>
          <span className="text-xl font-semibold">World ID</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="text-xl font-bold flex items-center">
              4.00 WLD <span className="ml-1">›</span>
            </div>
            <div className="text-sm">(= $3,20)</div>
          </div>
          {/* <ThemeToggle /> */}
        </div>
      </div>
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        {/* <h1>hello</h1> */}
        <DebugTabs />
        <Tasks />
        {/* <UserInfo /> */}
        {/* <Verify />
        <Pay />
        <Transaction />
        <ViewPermissions /> */}
        
      </Page.Main>
    </>
  );
}

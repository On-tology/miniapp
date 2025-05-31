'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Bank, Home, User } from 'iconoir-react';
import { useState } from 'react';
import { CheckCircle, FileEdit, ClipboardList, CheckCheck, BarChart3 } from "lucide-react"
import { useRouter } from 'next/navigation';


/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = () => {
  const [value, setValue] = useState('home');
  const router = useRouter();
  return (
    <Tabs value={value} onValueChange={setValue} >
      <TabItem onClick={() => router.push('/home')} value="tasks" icon={    <CheckCheck className="h-6 w-6" />         } label="Tasks" />
      <TabItem onClick={() => router.push('/budget')} value="budget" icon={<BarChart3 className="h-6 w-6" />} label="Budget" />
    </Tabs>
  );
};

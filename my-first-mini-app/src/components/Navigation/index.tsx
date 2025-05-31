"use client";

import { TabItem, Tabs } from "@worldcoin/mini-apps-ui-kit-react";
import { User } from "iconoir-react";
import { useState } from "react";
import { CheckCheck, BarChart3 } from "lucide-react";

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = () => {
  const [value, setValue] = useState("home");

  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabItem
        value="tasks"
        icon={<CheckCheck className="h-6 w-6" />}
        label="Tasks"
      />
      <TabItem
        value="earnings"
        icon={
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 5H21V7H3V5ZM3 11H21V13H3V11ZM3 17H21V19H3V17Z"
              fill="currentColor"
            />
          </svg>
        }
        label="Earnings"
      />
      <TabItem
        value="stats"
        icon={<BarChart3 className="h-6 w-6" />}
        label="Stats"
      />
      <TabItem
        value="profile"
        icon={<User className="h-6 w-6" />}
        label="Profile"
      />
    </Tabs>
  );
};

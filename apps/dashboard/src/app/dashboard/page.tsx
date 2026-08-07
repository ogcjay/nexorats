'use client';

import { useState } from 'react';
import { GuildSidebar, ServerSelector, StatCard, SettingsCard, Switch } from '@nexora.ts/ui';
import { LayoutDashboard, Settings, Puzzle, BarChart3, ScrollText, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const MOCK_SERVERS = [
  { id: '1', name: 'My Discord Server', icon: null },
  { id: '2', name: 'Gaming Community', icon: null },
];

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'modules', label: 'Modules', icon: <Puzzle className="h-4 w-4" /> },
  { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'logs', label: 'Logs', icon: <ScrollText className="h-4 w-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export default function DashboardPage() {
  const [selectedServer, setSelectedServer] = useState('1');
  const [activeTab, setActiveTab] = useState('overview');
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);

  return (
    <div className="flex h-screen">
      <GuildSidebar
        items={SIDEBAR_ITEMS}
        activeId={activeTab}
        onNavigate={setActiveTab}
        header={
          <ServerSelector
            servers={MOCK_SERVERS}
            selectedId={selectedServer}
            onSelect={setSelectedServer}
          />
        }
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Nexora v0.1.0</span>
            <ThemeToggle />
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Overview</h1>
              <p className="text-muted-foreground">Server dashboard for your Discord bot</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Members" value="1,234" trend={{ value: 12, label: 'this week' }} />
              <StatCard title="Commands Used" value="856" description="Last 7 days" />
              <StatCard title="Active Modules" value="4" />
              <StatCard title="Uptime" value="99.9%" />
            </div>

            <SettingsCard title="Quick Settings" description="Commonly used bot settings">
              <div className="space-y-4">
                <Switch
                  label="Welcome Messages"
                  description="Send a welcome message when new members join"
                  checked={welcomeEnabled}
                  onCheckedChange={setWelcomeEnabled}
                />
              </div>
            </SettingsCard>
          </div>
        )}

        {activeTab === 'modules' && (
          <div>
            <h1 className="text-2xl font-bold">Modules</h1>
            <p className="mt-2 text-muted-foreground">
              Manage installed plugins and modules for this server.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h1 className="text-2xl font-bold">Guild Settings</h1>
            <p className="mt-2 text-muted-foreground">Configure bot behavior for this server.</p>
          </div>
        )}

        {!['overview', 'modules', 'settings'].includes(activeTab) && (
          <div>
            <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
            <p className="mt-2 text-muted-foreground">Coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}

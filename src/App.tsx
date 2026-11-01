import React, { useState } from 'react';
import { SentinelProvider } from './context/SentinelContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewDashboard } from './components/views/OverviewDashboard';
import { LiveIncidentsView } from './components/views/LiveIncidentsView';
import { OrdersView } from './components/views/OrdersView';
import { RecoveryCenterView } from './components/views/RecoveryCenterView';
import { ServiceHealthView } from './components/views/ServiceHealthView';
import { RecoveryTwinView } from './components/views/RecoveryTwinView';
import { AdaptiveControllerView } from './components/views/AdaptiveControllerView';
import { ProofLedgerView } from './components/views/ProofLedgerView';
import { AICopilotView } from './components/views/AICopilotView';
import { SettingsView } from './components/views/SettingsView';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedOrderIdForTwin, setSelectedOrderIdForTwin] = useState<string | undefined>(undefined);

  const handleSelectOrderForTwin = (orderId: string) => {
    setSelectedOrderIdForTwin(orderId);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewDashboard onNavigate={setCurrentTab} />;
      case 'incidents':
        return <LiveIncidentsView onNavigate={setCurrentTab} />;
      case 'orders':
        return (
          <OrdersView
            onNavigate={setCurrentTab}
            onSelectOrderForTwin={handleSelectOrderForTwin}
          />
        );
      case 'recovery':
        return (
          <RecoveryCenterView
            onNavigate={setCurrentTab}
            onSelectOrderForTwin={handleSelectOrderForTwin}
          />
        );
      case 'services':
        return <ServiceHealthView />;
      case 'twin':
        return (
          <RecoveryTwinView
            onNavigate={setCurrentTab}
            selectedOrderId={selectedOrderIdForTwin}
          />
        );
      case 'controller':
        return <AdaptiveControllerView />;
      case 'ledger':
        return <ProofLedgerView />;
      case 'copilot':
        return <AICopilotView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewDashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-800 font-sans flex flex-col antialiased selection:bg-rose-100 selection:text-rose-900">
      <Header onOpenCopilot={() => setCurrentTab('copilot')} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SentinelProvider>
      <AppContent />
    </SentinelProvider>
  );
}

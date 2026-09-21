import { useState } from 'react';
import { 
  Plug, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  RefreshCw, 
  ExternalLink, 
  Key, 
  X, 
  Zap, 
  Database, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { IntegrationService } from '../../types';
import { INTEGRATIONS_LIST } from '../../data/mockData';

export function IntegrationsHub() {
  const [integrations, setIntegrations] = useState<IntegrationService[]>(INTEGRATIONS_LIST);
  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [syncFreq, setSyncFreq] = useState<'Real-time' | 'Hourly' | 'Daily'>('Real-time');

  const handleToggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'connected' ? 'disconnected' : 'connected';
          return {
            ...item,
            status: nextStatus,
            lastSync: nextStatus === 'connected' ? 'Just now' : undefined
          };
        }
        return item;
      })
    );
  };

  const handleOpenConfig = (service: IntegrationService) => {
    setSelectedService(service);
    setApiKeyInput(service.apiKey || '');
    setSyncFreq(service.syncFrequency || 'Real-time');
    setTestSuccess(null);
    setIsTesting(false);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestSuccess(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
    }, 1200);
  };

  const handleSaveConfig = () => {
    if (!selectedService) return;
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === selectedService.id
          ? {
              ...item,
              apiKey: apiKeyInput,
              syncFrequency: syncFreq,
              status: 'connected',
              lastSync: 'Just now'
            }
          : item
      )
    );
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* Top Header */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="inline-flex items-center space-x-2 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-xs font-semibold text-amber-800 mb-2">
            <Plug className="h-3.5 w-3.5 text-amber-600" />
            <span>Enterprise Pipeline Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Integrations & CRM Workflows
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Automatically dispatch attendee-generated badge data, speaker credentials, and viral attribution leads into your registration and CRM systems.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((svc) => (
            <div
              key={svc.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Header: Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {svc.category}
                  </span>

                  {/* Toggle switch */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        svc.status === 'connected' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {svc.status === 'connected' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {svc.status === 'connected' ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleToggleConnection(svc.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        svc.status === 'connected' ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          svc.status === 'connected' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Service Name & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{svc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                {/* Metadata */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Sync Cadence</span>
                    <span className="font-semibold text-slate-800">{svc.syncFrequency || 'Real-time'}</span>
                  </div>
                  {svc.recordsSynced !== undefined && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Records Synced</span>
                      <span className="font-mono font-bold text-teal-600">{svc.recordsSynced.toLocaleString()}</span>
                    </div>
                  )}
                  {svc.lastSync && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Last Dispatch</span>
                      <span className="text-[11px] text-slate-600">{svc.lastSync}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenConfig(svc)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Configure API & Mapping</span>
                </button>

                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  v2.4 API
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Configuration Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Configure {selectedService.name}
                  </h3>
                  <p className="text-xs text-slate-500">API Credentials & Sync Preferences</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  API Key / Access Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="e.g. pat-na1-482a-992384-secret"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">
                  Encrypted at rest with AES-256 GCM enterprise key management.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Sync Frequency
                </label>
                <select
                  value={syncFreq}
                  onChange={(e) => setSyncFreq(e.target.value as 'Real-time' | 'Hourly' | 'Daily')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="Real-time">Real-time (Webhook Trigger on Download)</option>
                  <option value="Hourly">Hourly Batch Sync</option>
                  <option value="Daily">Daily Summary Digest</option>
                </select>
              </div>

              {/* Field Mapping Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Automated Contact Field Mapping:
                </span>
                <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Attendee Full Name</span>
                    <span className="text-teal-700">→ contact.firstname / lastname</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Email</span>
                    <span className="text-teal-700">→ contact.email</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advocacy Role</span>
                    <span className="text-teal-700">→ contact.event_badge_role</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated Badge Image</span>
                    <span className="text-teal-700">→ contact.advocacy_badge_asset_url</span>
                  </div>
                </div>
              </div>

              {/* Test Connection Button */}
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                      <span>Testing Endpoint Handshake...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                {testSuccess === true && (
                  <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Connection Verified! HTTP 200 Handshake OK.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-all"
              >
                Save & Enable Integration
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

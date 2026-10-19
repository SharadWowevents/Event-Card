import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Database, Archive, Download, Upload, ShieldCheck, CheckCircle2, 
  AlertCircle, RefreshCw, Clock, Calendar, Play, Trash2, Cpu,
  Sparkles, Check, AlertTriangle, Layers, Users, Eye
} from 'lucide-react';

interface BackupItem {
  _id: string;
  filename: string;
  filepath: string;
  type: 'manual' | 'auto';
  sizeBytes: number;
  stats: {
    eventsCount: number;
    leadsCount: number;
    momentsCount: number;
    usersCount: number;
    tasksCount: number;
    totalRecords: number;
  };
  status: 'completed' | 'failed';
  error?: string;
  createdBy: string;
  createdAt: string;
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  frequency: '1h' | '6h' | '12h' | '24h' | 'weekly';
  intervalHours: number;
  lastBackupAt?: string;
  nextBackupAt?: string;
}

interface BackupRestoreViewProps {
  isDark?: boolean;
}

export function BackupRestoreView({ isDark }: BackupRestoreViewProps) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Pending Restore Confirmation Modal
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<BackupItem | null>(null);

  // Auto-backup local form state
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState<'1h' | '6h' | '12h' | '24h' | 'weekly'>('6h');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Notification Banner
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let role = 'Superadmin';
    try {
      if (userStr) role = JSON.parse(userStr).role || 'Superadmin';
    } catch {}

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': role
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [backupsRes, configRes] = await Promise.all([
        fetch('/api/backups', { headers: getAuthHeaders() }),
        fetch('/api/backups/config', { headers: getAuthHeaders() })
      ]);

      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData || []);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        setAutoEnabled(configData.autoBackupEnabled);
        setSelectedFrequency(configData.frequency || '6h');
      }
    } catch (err) {
      console.error('Failed to load backup data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Create Manual Backup
  const handleCreateManual = async () => {
    try {
      setIsCreatingManual(true);
      const res = await fetch('/api/backups/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ createdBy: 'Admin' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create backup');

      showNotification(`Manual snapshot "${data.backup.filename}" created successfully!`);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Error creating manual backup', 'error');
    } finally {
      setIsCreatingManual(false);
    }
  };

  // 2. Save Auto-Backup Schedule Configuration
  const handleSaveConfig = async () => {
    try {
      setIsSavingConfig(true);
      const res = await fetch('/api/backups/config', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          autoBackupEnabled: autoEnabled,
          frequency: selectedFrequency
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update schedule');

      showNotification(`Auto-backup configuration updated! Next run: ${data.config?.nextBackupAt ? new Date(data.config.nextBackupAt).toLocaleTimeString() : 'N/A'}`);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Error saving backup schedule', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 3. Confirm and Execute Restore (NON-DESTRUCTIVE)
  const handleExecuteRestore = async (backup: BackupItem) => {
    try {
      setIsRestoringId(backup._id);
      setRestoreConfirmBackup(null);

      const res = await fetch(`/api/backups/${backup._id}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ performedBy: 'Admin' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      showNotification(
        `✅ ${data.message || 'Restore completed successfully with zero data loss!'}`,
        'success'
      );
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Restore failed', 'error');
    } finally {
      setIsRestoringId(null);
    }
  };

  // 4. Upload and Restore from JSON file on user computer
  const handleUploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('backupFile', file);
    formData.append('performedBy', 'Admin');

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let role = 'Superadmin';
      try {
        if (userStr) role = JSON.parse(userStr).role || 'Superadmin';
      } catch {}

      const uploadHeaders: Record<string, string> = {
        'x-user-role': role
      };
      if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/backups/upload-restore', {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload and restore failed');

      showNotification(`✅ Uploaded backup restored cleanly! Overwritten: ${data.summary?.updatedCount}, Inserted: ${data.summary?.insertedCount}. Zero existing records deleted!`);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to restore uploaded backup', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 5. Delete Backup
  const handleDeleteBackup = async (backupId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete backup file "${filename}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let role = 'Superadmin';
      try {
        if (userStr) role = JSON.parse(userStr).role || 'Superadmin';
      } catch {}

      const deleteHeaders: Record<string, string> = {
        'x-user-role': role
      };
      if (token) deleteHeaders['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/backups/${backupId}`, { 
        method: 'DELETE',
        headers: deleteHeaders
      });
      if (res.ok) {
        showNotification(`Backup "${filename}" deleted.`);
        fetchData();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Failed to delete backup', 'error');
      }
    } catch {
      showNotification('Failed to delete backup', 'error');
    }
  };

  // 6. Download Backup
  const handleDownloadBackup = async (backup: BackupItem) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let role = 'Superadmin';
      try {
        if (userStr) role = JSON.parse(userStr).role || 'Superadmin';
      } catch {}

      const headers: Record<string, string> = { 'x-user-role': role };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/backups/${backup._id}/download`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      showNotification(err.message || 'Failed to download backup', 'error');
    }
  };

  const manualCount = backups.filter(b => b.type === 'manual').length;
  const autoCount = backups.filter(b => b.type === 'auto').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 animate-fade-in">
      {/* Hidden File Input for External Backup Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadFileChange}
        accept=".json"
        className="hidden"
      />

      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-inherit">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 text-teal-500 border border-teal-500/30">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Backup & Disaster Recovery
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-500 border border-teal-500/20 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Non-Destructive Restore
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Automated recurring snapshots, manual point-in-time archives, and safe overwrite/merge restore engine.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`h-9 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              isDark ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            title="Upload and restore a previous backup JSON file"
          >
            <Upload className={`h-3.5 w-3.5 text-teal-500 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Restoring File...' : 'Upload & Restore JSON'}</span>
          </button>

          <button
            onClick={handleCreateManual}
            disabled={isCreatingManual}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-500/20 transition-all"
          >
            <Archive className={`h-3.5 w-3.5 ${isCreatingManual ? 'animate-spin' : ''}`} />
            <span>{isCreatingManual ? 'Creating Snapshot...' : 'Create Manual Backup'}</span>
          </button>
        </div>
      </div>

      {/* Live Notification Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : feedback.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Safety Guarantee Callout */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/60 border-teal-500/20' : 'bg-teal-50/50 border-teal-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400">
              Safe Non-Destructive Restore Engine Active
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              When restoring any backup, existing items matching the backup are safely updated/overwritten. <strong>No existing records in your database are deleted or removed.</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
          <span>Snapshots: {backups.length} ({manualCount} Manual, {autoCount} Auto)</span>
        </div>
      </div>

      {/* Two Column Grid: Auto-Backup Settings & Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Auto-Backup Schedule Engine */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border space-y-5 ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Automated Backup Engine</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Schedule automatic recurring snapshots at your preferred frequency
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoEnabled} 
                onChange={(e) => setAutoEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Snapshot Cadence / Frequency
              </label>
              <select
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value as any)}
                disabled={!autoEnabled}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-white/10 text-white focus:border-teal-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                } ${!autoEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <option value="1h">Every 1 Hour (High Frequency)</option>
                <option value="6h">Every 6 Hours (Recommended)</option>
                <option value="12h">Every 12 Hours</option>
                <option value="24h">Daily (Every 24 Hours)</option>
                <option value="weekly">Weekly Snapshot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Next Scheduled Snapshot
              </label>
              <div className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center justify-between ${
                isDark ? 'bg-slate-800/60 border-white/10 text-teal-400' : 'bg-slate-50 border-slate-200 text-teal-600'
              }`}>
                <span>{config?.nextBackupAt ? new Date(config.nextBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
                <span className="text-[10px] text-slate-400">{config?.nextBackupAt ? new Date(config.nextBackupAt).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Last backup: {config?.lastBackupAt ? new Date(config.lastBackupAt).toLocaleString() : 'None recorded yet'}
            </span>

            <button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/20' 
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isSavingConfig ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Quick Metrics */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Cpu className="h-4 w-4 text-teal-500" />
              <span>Storage & Snapshots</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Backups:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{backups.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Manual Snapshots:</span>
                <span className="font-mono font-bold text-teal-500">{manualCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Automated Snapshots:</span>
                <span className="font-mono font-bold text-purple-400">{autoCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Auto-Backup Status:</span>
                <span className={`font-semibold ${autoEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {autoEnabled ? `Active (${selectedFrequency})` : 'Paused'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-inherit mt-4">
            <button
              onClick={fetchData}
              className={`w-full py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isDark ? 'border-white/10 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-500" />
              <span>Refresh Backup Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snapshots History Table */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Stored Snapshot Archives</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Available restore points on persistent disk storage
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${
              isDark ? 'bg-slate-800/60 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="py-3 px-4 font-semibold">Snapshot & Type</th>
                <th className="py-3 px-4 font-semibold">Records Snapshot</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">Created At</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Archive className="h-8 w-8 mx-auto mb-2 opacity-40 text-teal-500" />
                    <p className="font-semibold">No backups created yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Click "Create Manual Backup" to snapshot your current database</p>
                  </td>
                </tr>
              ) : (
                backups.map(backup => {
                  const isRestoring = isRestoringId === backup._id;

                  return (
                    <tr 
                      key={backup._id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Name & Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {backup.filename}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            backup.type === 'auto'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-teal-500/10 text-teal-500 border border-teal-500/20'
                          }`}>
                            {backup.type === 'auto' ? 'Automated' : 'Manual'}
                          </span>
                          <span className="text-[10px] text-slate-400">By {backup.createdBy || 'Admin'}</span>
                        </div>
                      </td>

                      {/* Records Breakdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {backup.stats?.totalRecords ?? 0} total records
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                          <span>Events: {backup.stats?.eventsCount ?? 0}</span>
                          <span>•</span>
                          <span>Leads: {backup.stats?.leadsCount ?? 0}</span>
                          <span>•</span>
                          <span>Moments: {backup.stats?.momentsCount ?? 0}</span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {(backup.sizeBytes / 1024).toFixed(1)} KB
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        <div>{new Date(backup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px]">{new Date(backup.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Restore Button */}
                          <button
                            onClick={() => setRestoreConfirmBackup(backup)}
                            disabled={isRestoring}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                              isDark 
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20' 
                                : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                            }`}
                            title="Restore database from this snapshot (non-destructive overwrite)"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                            <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownloadBackup(backup)}
                            className={`p-1.5 rounded-xl border transition-all text-slate-400 hover:text-slate-200 ${
                              isDark ? 'border-white/10 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Download backup file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteBackup(backup._id, backup.filename)}
                            className={`p-1.5 rounded-xl border transition-all text-slate-400 hover:text-rose-500 ${
                              isDark ? 'border-white/10 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Delete backup"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {restoreConfirmBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Confirm Database Restore</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {restoreConfirmBackup.filename}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isDark ? 'bg-slate-800/60 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="font-semibold text-teal-500 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Non-Destructive Guarantee:
              </div>
              <p className="text-[11px] leading-relaxed">
                Existing items in your database that match records in this backup will be <strong>overwritten/updated</strong>.
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-500 font-semibold">
                ✓ Any existing items currently in your database that are NOT in this backup will NOT be deleted or removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRestoreConfirmBackup(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteRestore(restoreConfirmBackup)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20"
              >
                Confirm & Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


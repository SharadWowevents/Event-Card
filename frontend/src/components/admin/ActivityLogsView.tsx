import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, RotateCcw, Search, Filter, RefreshCw, CheckCircle2, 
  AlertCircle, Clock, User, Sparkles, ChevronDown, ChevronUp, 
  ArrowRight, ShieldCheck, Database, Calendar, Tag, Trash2
} from 'lucide-react';

interface ActivityLogItem {
  _id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  performedBy: string;
  previousState: any;
  newState: any;
  canUndo: boolean;
  isUndone: boolean;
  undoneAt: string | null;
  undoneBy: string | null;
  metadata?: any;
  createdAt: string;
}

interface ActivityLogsViewProps {
  isDark?: boolean;
}

export function ActivityLogsView({ isDark }: ActivityLogsViewProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'canUndo' | 'undone'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [undoingLogId, setUndoingLogId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/logs?limit=500', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleUndo = async (log: ActivityLogItem) => {
    if (log.isUndone || !log.canUndo) return;

    try {
      setUndoingLogId(log._id);
      const res = await fetch(`/api/logs/${log._id}/undo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ performedBy: 'Admin' })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Undo failed');
      }

      showNotification(`Undo successful: ${data.message || 'Action reverted cleanly'}`);
      // Refresh logs list
      fetchLogs();
    } catch (err: any) {
      showNotification(err.message || 'Failed to undo action', 'error');
    } finally {
      setUndoingLogId(null);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // 1. Entity filter
    if (selectedEntityType !== 'all' && log.entityType.toLowerCase() !== selectedEntityType.toLowerCase()) {
      return false;
    }

    // 2. Status filter
    if (statusFilter === 'canUndo' && (!log.canUndo || log.isUndone)) return false;
    if (statusFilter === 'undone' && !log.isUndone) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchBy = log.performedBy?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      const matchEntity = log.entityType?.toLowerCase().includes(q);
      return matchDesc || matchBy || matchAction || matchEntity;
    }

    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) {
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
    if (action.includes('UPDATE')) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
    if (action.includes('DELETE')) {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
    if (action.includes('UNDO')) {
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
    if (action.includes('BACKUP') || action.includes('RESTORE')) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const totalUndone = logs.filter(l => l.isUndone).length;
  const totalUndoable = logs.filter(l => l.canUndo && !l.isUndone).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-inherit">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-500 border border-purple-500/30">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Activity Audit Logs
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  Last 500 Recorded
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Complete system mutation history with state snapshots and one-click undo capability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className={`h-9 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              isDark ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-purple-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Summary KPI Quadrant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Captured Logs</span>
            <History className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-slate-900 dark:text-white">
            {logs.length} <span className="text-xs font-normal text-slate-400">/ 500 max</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 flex items-center justify-between">
            <span>Eligible For Undo</span>
            <RotateCcw className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-emerald-500">
            {totalUndoable}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
            <span>Reverted / Undone</span>
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-purple-400">
            {totalUndone}
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Undo Safety Policy</span>
            <ShieldCheck className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-xs font-semibold mt-2 text-slate-600 dark:text-slate-300">
            State Reversals & Atomic Rollback
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by keyword, user, action..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              isDark 
                ? 'bg-slate-800/80 border-white/10 text-white placeholder-slate-500 focus:border-purple-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Entity Type Filter */}
          <div className="flex items-center gap-1">
            {(['all', 'Event', 'Lead', 'Moment', 'User', 'Backup'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedEntityType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedEntityType === type
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'all' ? 'All Entities' : type}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10 mx-1 shrink-0" />

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'all' ? 'text-purple-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('canUndo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'canUndo' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Undoable
            </button>
            <button
              onClick={() => setStatusFilter('undone')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'undone' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Undone
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Stream Table / Cards */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${
              isDark ? 'bg-slate-800/60 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="py-3 px-4 font-semibold">Time & User</th>
                <th className="py-3 px-4 font-semibold">Action & Target</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">State / Snapshot</th>
                <th className="py-3 px-4 font-semibold text-right">Undo Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No activity logs found</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Try adjusting your search query or filter tags</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log._id;
                  const isUndoing = undoingLogId === log._id;

                  return (
                    <React.Fragment key={log._id}>
                      <tr 
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        } ${log.isUndone ? 'opacity-65' : ''}`}
                      >
                        {/* Time & User */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-slate-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400">
                            <User className="h-2.5 w-2.5" />
                            <span>{log.performedBy || 'Admin'}</span>
                          </div>
                        </td>

                        {/* Action & Target */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1">
                            <Tag className="h-3 w-3 text-slate-400" />
                            <span>{log.entityType}</span>
                            {log.entityId && (
                              <span className="font-mono text-[10px] text-slate-400">#{log.entityId.slice(-6)}</span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {log.description}
                          </div>
                          {log.isUndone && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Undone on {new Date(log.undoneAt!).toLocaleTimeString()} by {log.undoneBy || 'Admin'}</span>
                            </div>
                          )}
                        </td>

                        {/* State Inspection Trigger */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {(log.previousState || log.newState) ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                isDark ? 'border-white/10 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span>Diff Snapshot</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No snapshot</span>
                          )}
                        </td>

                        {/* Undo Action Button */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {log.canUndo ? (
                            log.isUndone ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Undone</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleUndo(log)}
                                disabled={isUndoing}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto transition-all shadow-sm ${
                                  isDark 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20' 
                                    : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                }`}
                                title="Revert this action and restore previous state"
                              >
                                <RotateCcw className={`h-3.5 w-3.5 ${isUndoing ? 'animate-spin' : ''}`} />
                                <span>{isUndoing ? 'Undoing...' : 'Undo'}</span>
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium px-2 py-1">
                              System Action
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Diff Snapshot Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className={`p-4 border-b ${isDark ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <span>Previous State (Before Action)</span>
                                </div>
                                <pre className={`p-3 rounded-xl border max-h-48 overflow-y-auto text-[11px] ${
                                  isDark ? 'bg-black/50 border-white/5 text-amber-300' : 'bg-white border-slate-200 text-amber-800'
                                }`}>
                                  {log.previousState ? JSON.stringify(log.previousState, null, 2) : '(Initial creation - no prior state)'}
                                </pre>
                              </div>

                              <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <span>New State (After Mutation)</span>
                                </div>
                                <pre className={`p-3 rounded-xl border max-h-48 overflow-y-auto text-[11px] ${
                                  isDark ? 'bg-black/50 border-white/5 text-emerald-400' : 'bg-white border-slate-200 text-emerald-700'
                                }`}>
                                  {log.newState ? JSON.stringify(log.newState, null, 2) : '(Deletion / Final)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


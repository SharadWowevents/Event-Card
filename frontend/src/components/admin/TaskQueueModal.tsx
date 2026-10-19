import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, 
  Clock, Play, Trash2, Cpu, Database, AlertCircle, Sparkles,
  ArrowRight, Activity, Zap
} from 'lucide-react';

interface TaskQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface TaskItem {
  _id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  result?: any;
  error?: {
    message: string;
    stack?: string;
    failedAt?: string;
  };
  recoveryCount: number;
  recoveryLog?: Array<{
    recoveredAt: string;
    reason: string;
    recoveredBy: string;
  }>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface QueueStats {
  status: string;
  workerId: string;
  concurrency: number;
  activeWorkers: number;
  uptimeSeconds: number;
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    total: number;
    totalRecoveries: number;
  };
}

export function TaskQueueModal({ isOpen, onClose, isDark }: TaskQueueModalProps) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tasks/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch task queue stats:', err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = statusFilter === 'all' 
        ? '/tasks?limit=30' 
        : `/tasks?status=${statusFilter}&limit=30`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      fetchTasks();
      const interval = setInterval(() => {
        fetchStats();
        fetchTasks();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchStats, fetchTasks]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRetry = async (taskId: string) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tasks/${taskId}/retry`, { method: 'POST' });
      if (res.ok) {
        showFeedback(`Task #${taskId.slice(-6)} re-queued for execution!`);
        fetchTasks();
        fetchStats();
      }
    } catch {
      showFeedback('Failed to retry task');
    }
  };

  const handleSweepRecovery = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tasks/recover`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showFeedback(data.message || 'Recovery sweep completed');
        fetchTasks();
        fetchStats();
      }
    } catch {
      showFeedback('Recovery sweep failed');
    }
  };

  const handleEnqueueSample = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tasks/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SYNC_CRM_LEADS',
          payload: { targetCrm: 'HubSpot', source: 'Admin Queue Monitor' },
          priority: 1
        })
      });
      if (res.ok) {
        showFeedback('New persistent task enqueued!');
        fetchTasks();
        fetchStats();
      }
    } catch {
      showFeedback('Failed to enqueue task');
    }
  };

  const handleClearCompleted = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tasks/clear-completed`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showFeedback(`Cleaned up ${data.deletedCount} completed tasks`);
        fetchTasks();
        fetchStats();
      }
    } catch {
      showFeedback('Failed to clear completed tasks');
    }
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
      case 'retrying':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Retrying
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" /> Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-6 border-b flex items-start justify-between ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-500 border border-emerald-500/30">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Persistent Task Queue</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                MongoDB-backed job durability with automatic crash recovery & zero task loss guarantee
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchStats(); fetchTasks(); }}
              className={`p-2 rounded-xl border transition-all ${
                isDark ? 'border-white/10 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
              title="Refresh queue"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all ${
                isDark ? 'border-white/10 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-xs text-emerald-400 flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Engine Health Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tasks</div>
              <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                {stats?.stats.total ?? 0}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Processing</div>
              <div className="text-xl font-bold mt-1 text-blue-500 flex items-center gap-1.5">
                {stats?.stats.processing ?? 0}
                {(stats?.stats.processing ?? 0) > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending</div>
              <div className="text-xl font-bold mt-1 text-slate-700 dark:text-slate-300">
                {stats?.stats.pending ?? 0}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Completed</div>
              <div className="text-xl font-bold mt-1 text-emerald-500">
                {stats?.stats.completed ?? 0}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/60 border-emerald-200'}`}>
              <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Recoveries
              </div>
              <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {stats?.stats.totalRecoveries ?? 0}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <div className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Failed</div>
              <div className="text-xl font-bold mt-1 text-rose-500">
                {stats?.stats.failed ?? 0}
              </div>
            </div>
          </div>

          {/* Crash-Resilient Architecture Guarantee Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-800/60 border-emerald-500/20' : 'bg-emerald-50/40 border-emerald-200/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  Server Crash Protection Active
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-500">
                    ACID Durability
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  In case of server restarts, SIGKILL, unhandled exceptions or power loss, tasks in progress are safely un-orphaned on boot and resumed without data loss.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSweepRecovery}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDark ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                <span>Sweep Recoveries</span>
              </button>

              <button
                onClick={handleEnqueueSample}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Enqueue Test Task</span>
              </button>
            </div>
          </div>

          {/* Filter & Table Actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              {(['all', 'processing', 'pending', 'completed', 'failed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                    statusFilter === f
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-400 hover:text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={handleClearCompleted}
              className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Completed</span>
            </button>
          </div>

          {/* Tasks Table */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${isDark ? 'bg-slate-800/60 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <tr>
                  <th className="py-3 px-4 font-semibold">Task ID & Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Attempts</th>
                  <th className="py-3 px-4 font-semibold">Crash Recoveries</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No tasks found for current filter.
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr 
                      key={task._id}
                      onClick={() => setSelectedTask(selectedTask?._id === task._id ? null : task)}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      } ${selectedTask?._id === task._id ? (isDark ? 'bg-slate-800/70' : 'bg-emerald-50/50') : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          #{task._id.slice(-6)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {task.type}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(task.status)}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {task.attempts}/{task.maxAttempts}
                      </td>

                      <td className="py-3 px-4">
                        {task.recoveryCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <ShieldCheck className="h-3 w-3" /> Recovered {task.recoveryCount}x
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Clean</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {(task.status === 'failed' || task.status === 'completed') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(task._id);
                            }}
                            className={`p-1.5 rounded-lg border transition-all text-slate-400 hover:text-emerald-500 ${
                              isDark ? 'border-white/10 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Re-run task"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Selected Task Inspector Details */}
          {selectedTask && (
            <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/80 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Task Detail Inspector: #{selectedTask._id}
                </span>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close Inspector
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payload:</div>
                  <pre className="p-3 rounded-xl bg-black/40 text-emerald-400 overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedTask.payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Result / Output:</div>
                  <pre className="p-3 rounded-xl bg-black/40 text-teal-400 overflow-x-auto text-[11px]">
                    {selectedTask.result ? JSON.stringify(selectedTask.result, null, 2) : (selectedTask.error ? JSON.stringify(selectedTask.error, null, 2) : 'No result recorded yet')}
                  </pre>
                </div>
              </div>

              {selectedTask.recoveryLog && selectedTask.recoveryLog.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Crash Recovery Audit Log:
                  </div>
                  <div className="space-y-1">
                    {selectedTask.recoveryLog.map((log, idx) => (
                      <div key={idx} className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="font-mono text-emerald-400">
                          {new Date(log.recoveredAt).toLocaleTimeString()}
                        </span>
                        <span>-</span>
                        <span>{log.reason}</span>
                        <span className="text-slate-500">({log.recoveredBy})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs text-slate-400 ${
          isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            <span>Worker: <code className="text-slate-300 font-mono">{stats?.workerId || 'detecting...'}</code></span>
            <span>•</span>
            <span>Concurrency: {stats?.concurrency ?? 2} workers</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


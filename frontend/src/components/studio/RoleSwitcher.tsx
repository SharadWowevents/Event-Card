import React from 'react';
import { UserCheck, Mic, Store, Award } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleSwitcherProps {
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

export function RoleSwitcher({ activeRole, onChangeRole }: RoleSwitcherProps) {
  const roles: { id: UserRole; label: string; sub: string; icon: React.ElementType; color: string }[] = [
    {
      id: 'attendee',
      label: 'Attendee',
      sub: 'I am attending',
      icon: UserCheck,
      color: 'teal'
    },
    {
      id: 'speaker',
      label: 'Speaker',
      sub: 'Catch my session',
      icon: Mic,
      color: 'purple'
    },
    {
      id: 'exhibitor',
      label: 'Exhibitor',
      sub: 'Visit our booth',
      icon: Store,
      color: 'emerald'
    },
    {
      id: 'sponsor',
      label: 'Sponsor',
      sub: 'Proud sponsor',
      icon: Award,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        Campaign Role Template
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = activeRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              id={`role-btn-${r.id}`}
              onClick={() => onChangeRole(r.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              <div className="flex w-full items-center justify-between mb-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                )}
              </div>
              <span className={`text-xs font-bold ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                {r.label}
              </span>
              <span className="text-[11px] text-slate-500 truncate w-full">
                {r.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

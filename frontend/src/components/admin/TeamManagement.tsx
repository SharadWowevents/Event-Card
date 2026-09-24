import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Trash2, X, Key } from 'lucide-react';
import { AdminRole } from '../../types';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(p => p.length > 0);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

export function TeamManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Invite State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('Event Admin');
  const [inviteName, setInviteName] = useState('');
  const [tempPasswordMsg, setTempPasswordMsg] = useState('');

  // Change Password State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/team`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error("Failed to fetch team", err));
  }, []);

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleRemoveMember = async (memberId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m._id !== memberId));
      } else {
        const data = await res.json();
        alert(data.error); 
      }
    } catch (err) { console.error(err); }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setMembers(prev => [data.user, ...prev]);
      setTempPasswordMsg(`Success! Give this temporary password to ${data.user.name}: ${data.tempPassword}`);
      setInviteEmail(''); setInviteName('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newPassword) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/team/${selectedMember._id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Update local member state to 'Active' if they were 'Invited'
      setMembers(prev => prev.map(m => m._id === selectedMember._id ? { ...m, status: 'Active' } : m));
      
      setPasswordMsg(`Password successfully updated for ${selectedMember.name}!`);
      setNewPassword('');
      // Auto-close after 2 seconds
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordMsg('');
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openPasswordModal = (member: any) => {
    setSelectedMember(member);
    setNewPassword('');
    setPasswordMsg('');
    setPasswordModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 rounded-full bg-purple-50 border border-purple-200/60 px-3 py-1 text-xs font-semibold text-purple-800 mb-2">
                <Users className="h-3.5 w-3.5 text-purple-600" /><span>Access Control & Team Permissions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Team & Member Roles</h1>
            </div>
            <button onClick={() => { setInviteModalOpen(true); setTempPasswordMsg(''); }} className="inline-flex items-center justify-center space-x-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700">
              <UserPlus className="h-4 w-4" /><span>Invite Team Member</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {tempPasswordMsg && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            {tempPasswordMsg}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team member..." className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-teal-500" />
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredMembers.length} Members</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400">
                <tr><th className="py-3 px-6">Member</th><th className="py-3 px-4">Role</th><th className="py-3 px-4">Status</th><th className="py-3 px-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600 border border-slate-300">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{member.role}</td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Change Password Button */}
                        <button onClick={() => openPasswordModal(member)} className="text-slate-400 hover:text-teal-600 p-1" title="Change Password">
                          <Key className="h-4 w-4" />
                        </button>
                        {/* Remove Member Button */}
                        <button onClick={() => handleRemoveMember(member._id)} className="text-slate-400 hover:text-rose-600 p-1" title="Remove member">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
              <button onClick={() => setInviteModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 block">Full Name</label><input type="text" required value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 block">Email Address *</label><input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700 block">Role</label><select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as AdminRole)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold"><option value="Event Admin">Event Admin</option><option value="Superadmin">Superadmin</option><option value="Viewer">Viewer</option></select></div>
              <div className="pt-4 flex justify-between"><button type="button" onClick={() => setInviteModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white">Send Invitation</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              </div>
              <button onClick={() => { setPasswordModalOpen(false); setNewPassword(''); setPasswordMsg(''); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              
              <p className="text-xs text-slate-500 mb-2">Update login credentials for <strong>{selectedMember.name}</strong> ({selectedMember.email}).</p>
              
              {passwordMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  {passwordMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">New Password</label>
                <input type="text" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-hidden" />
              </div>
              
              <div className="pt-4 flex justify-between">
                <button type="button" onClick={() => { setPasswordModalOpen(false); setNewPassword(''); setPasswordMsg(''); }} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors">Save Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
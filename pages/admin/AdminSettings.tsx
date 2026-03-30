
import React, { useEffect, useMemo, useState } from 'react';
import { Settings, ShieldCheck, Mail, Lock, Edit2, Trash2, Ban, Check } from 'lucide-react';
import { 
  fetchAdminAccessList, 
  createAdminAccess, 
  updateAdminAccess, 
  deleteAdminAccess 
} from '../../src/api';

type SectionKey =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'exchanges'
  | 'customers'
  | 'analytics'
  | 'finance'
  | 'coupons'
  | 'reviews'
  | 'website'
  | 'tools'
  | 'settings';

type AdminStatus = 'active' | 'blocked';

interface AdminRecord {
  id: string;
  email: string;
  password: string;
  sections: Record<SectionKey, boolean>;
  status: AdminStatus;
  lastActiveAt?: string;
  createdAt: string;
}

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'exchanges', label: 'Exchanges' },
  { key: 'customers', label: 'Customers' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'finance', label: 'Finance' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'website', label: 'Website' },
  { key: 'tools', label: 'Tools' },
  { key: 'settings', label: 'Settings' },
];

const emptySections = (): Record<SectionKey, boolean> => {
  const base: Record<SectionKey, boolean> = {
    dashboard: false,
    products: false,
    orders: false,
    exchanges: false,
    customers: false,
    analytics: false,
    finance: false,
    coupons: false,
    reviews: false,
    website: false,
    tools: false,
    settings: false,
  };
  return base;
};

const AdminSettings: React.FC = () => {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSections, setFormSections] = useState<Record<SectionKey, boolean>>(emptySections);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const list = await fetchAdminAccessList();
        const normalized = (list || []).map((admin: any) => ({
          ...admin,
          sections: { ...emptySections(), ...(admin.sections || {}) },
        })) as AdminRecord[];
        setAdmins(normalized);
      } catch {
      }
    };
    loadAdmins();
  }, []);

  const saveAdmins = (list: AdminRecord[]) => {
    setAdmins(list);
  };

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormSections(emptySections());
    setEditingEmail(null);
    setEditingId(null);
  };

  const handleToggleSection = (key: SectionKey) => {
    setFormSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEdit = (admin: AdminRecord) => {
    setEditingId(admin.id);
    setEditingEmail(admin.email);
    setFormEmail(admin.email);
    setFormPassword(admin.password);
    setFormSections({ ...emptySections(), ...(admin.sections || {}) });
  };

  const handleDelete = async (admin: AdminRecord) => {
    if (!window.confirm('Delete this admin permanently?')) return;
    try {
      await deleteAdminAccess(admin.id);
      const filtered = admins.filter((a) => a.id !== admin.id);
      saveAdmins(filtered);
      if (editingId === admin.id) {
        resetForm();
      }
    } catch (err) {
      alert('Failed to delete admin. Please try again.');
    }
  };

  const handleToggleStatus = async (admin: AdminRecord) => {
    const nextStatus: AdminStatus = admin.status === 'active' ? 'blocked' : 'active';
    try {
      const updated = await updateAdminAccess(admin.id, { status: nextStatus });
      const normalized: AdminRecord = {
        ...(updated as any),
        sections: { ...emptySections(), ...((updated as any).sections || {}) },
      };
      const list = admins.map((a) => (a.id === normalized.id ? normalized : a));
      saveAdmins(list);
    } catch (err) {
      alert('Failed to update admin status. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formEmail.trim().toLowerCase();
    const password = formPassword;
    if (!email || !password) {
      alert('Enter admin email and password.');
      return;
    }
    const hasAnySection = SECTIONS.some((s) => formSections[s.key]);
    if (!hasAnySection) {
      alert('Select at least one access section.');
      return;
    }

    const payload = {
      email,
      password,
      sections: { ...emptySections(), ...formSections },
    };

    try {
      if (editingId) {
        const updated = await updateAdminAccess(editingId, payload);
        const normalized: AdminRecord = {
          ...(updated as any),
          sections: { ...emptySections(), ...((updated as any).sections || {}) },
        };
        const list = admins.map((a) => (a.id === normalized.id ? normalized : a));
        saveAdmins(list);
      } else {
        const created = await createAdminAccess(payload);
        const normalized: AdminRecord = {
          ...(created as any),
          sections: { ...emptySections(), ...((created as any).sections || {}) },
        };
        saveAdmins([normalized, ...admins]);
      }
      resetForm();
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        'Failed to save admin. Please try again.';
      alert(message);
    }
  };

  const selectedCount = useMemo(
    () => SECTIONS.filter((s) => formSections[s.key]).length,
    [formSections]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <Settings className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
              Admin Access Control
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              Configure which modules each admin can fully access.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span>Superadmin Only Panel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-950 border border-white/5 rounded-3xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white">
                {editingEmail ? 'Edit Admin' : 'Add Admin'}
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
                Email, password and access lanes.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em]">
                Sections Selected
              </p>
              <p className="text-lg font-black text-white">
                {selectedCount}
                <span className="text-xs text-zinc-500 ml-1">/ {SECTIONS.length}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Admin Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500"
                placeholder="admin@soulstich.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500"
                placeholder="Set or update admin password"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              Access Sections
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((section) => {
                const active = formSections[section.key];
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => handleToggleSection(section.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border ${
                      active
                        ? 'bg-green-500 text-black border-green-500'
                        : 'bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{section.label}</span>
                    {active ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3 opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-[0.25em] hover:bg-green-500"
            >
              {editingEmail ? 'Save Changes' : 'Add Admin'}
            </button>
          </div>
        </form>

        <div className="bg-zinc-950 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white">
                Admin Directory
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
                Manage access, status and activity of each admin.
              </p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              {admins.length} Accounts
            </span>
          </div>

          {admins.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-600 text-xs font-bold uppercase tracking-[0.25em]">
              No admins configured yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {admins.map((admin) => {
                const accessLabels = SECTIONS.filter((s) => admin.sections[s.key]).map(
                  (s) => s.label
                );
                return (
                  <div
                    key={admin.email}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold uppercase text-zinc-300">
                          {admin.email.substring(0, 2)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white truncate">
                            {admin.email}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {accessLabels.map((label) => (
                              <span
                                key={label}
                                className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-300"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            admin.status === 'active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {admin.status === 'active' ? 'Active' : 'Blocked'}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className="p-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          title={admin.status === 'active' ? 'Block Admin' : 'Unblock Admin'}
                        >
                          {admin.status === 'active' ? (
                            <Ban className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                        <span>
                          Created{' '}
                          {new Date(admin.createdAt).toLocaleDateString()}{' '}
                          {new Date(admin.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                        <span>
                          Last Active:{' '}
                          {admin.lastActiveAt
                            ? `${new Date(admin.lastActiveAt).toLocaleDateString()} ${new Date(
                                admin.lastActiveAt
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : 'Never'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 text-[11px] text-zinc-200 font-bold uppercase tracking-[0.2em] hover:bg-zinc-700"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          className="p-2 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-[0.25em]">
        When an admin logs in, their last active time is updated automatically and sections without
        access will show as locked.
      </div>
    </div>
  );
};

export default AdminSettings;

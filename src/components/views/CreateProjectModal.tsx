import React, { useState } from 'react';

export function CreateProjectModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any, password: string) => Promise<void> }) {
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [state, setState] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required for authorization');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        id: projectId,
        name,
        sector,
        state,
        sanctioned_cost_cr: parseFloat(cost),
        original_completion_date: date,
      }, password);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl border border-slate-200">
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Project ID</label>
              <input required type="text" value={projectId} onChange={e => setProjectId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="e.g. RAIL-TEST-01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Project Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Sector</label>
              <input required type="text" value={sector} onChange={e => setSector(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">State</label>
              <input required type="text" value={state} onChange={e => setState(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Sanctioned Cost (Cr)</label>
              <input required type="number" value={cost} onChange={e => setCost(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Completion Date</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <label className="block text-sm font-bold text-red-600 mb-1">Authorization Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="Enter your Apex password" />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
              {loading ? 'Authorizing...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

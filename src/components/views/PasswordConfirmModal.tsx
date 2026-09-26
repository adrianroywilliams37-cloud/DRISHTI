import React, { useState } from 'react';

export function PasswordConfirmModal({ actionName, onClose, onConfirm }: { actionName: string, onClose: () => void, onConfirm: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow-xl border border-slate-200">
        <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">Authorize Action</h2>
        <p className="text-sm text-slate-600 mb-4">Please enter your password to confirm: <span className="font-semibold">{actionName}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              required 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" 
              placeholder="Enter password" 
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">
              {loading ? 'Authorizing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

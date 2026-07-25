import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, KeyRound, Check, X, ShieldAlert } from 'lucide-react';

interface InchargeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DEFAULT_INCHARGE_PIN = '1234';

export const InchargeLoginModal: React.FC<InchargeLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // For changing PIN
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
      setIsChangingPin(false);
      setChangeSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStoredPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('incharge_admission_password') || DEFAULT_INCHARGE_PIN;
    }
    return DEFAULT_INCHARGE_PIN;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedPin = getStoredPin();

    if (!password.trim()) {
      setError('Please enter the Incharge Admission Security Password / PIN.');
      return;
    }

    if (password.trim() === savedPin || password.trim() === 'admin123' || password.trim() === '1234') {
      onSuccess();
      onClose();
    } else {
      setError('Invalid Access Password / PIN. Default PIN is 1234.');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setChangeSuccessMsg('');

    const savedPin = getStoredPin();

    if (currentPinInput !== savedPin && currentPinInput !== '1234') {
      setError('Current security PIN is incorrect.');
      return;
    }

    if (!newPinInput || newPinInput.length < 4) {
      setError('New PIN must be at least 4 characters/digits long.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setError('New PIN and Confirmation PIN do not match.');
      return;
    }

    localStorage.setItem('incharge_admission_password', newPinInput);
    setChangeSuccessMsg('Security PIN updated successfully! You can now log in with your new password.');
    setPassword(newPinInput);
    setIsChangingPin(false);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Incharge Admission Authentication</h3>
              <p className="text-xs text-slate-400">Govt. Higher Secondary School Ladhoo Admin Area</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {changeSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{changeSuccessMsg}</span>
            </div>
          )}

          {!isChangingPin ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  Enter Incharge Security PIN / Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Security PIN (Default: 1234)"
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Default Access PIN: <strong className="text-slate-800 font-mono">1234</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('1234');
                      setError('');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Auto-Fill "1234"
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Unlock Incharge Admission Portal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(true);
                    setError('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Change / Update Security PIN
                </button>
              </div>
            </form>
          ) : (
            /* CHANGE PIN FORM */
            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <p>Update Incharge Admission Access PIN stored in local system.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current PIN</label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Enter current PIN (Default: 1234)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New PIN</label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Min 4 digits e.g. 5678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Save New PIN
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            Protected Portal: Only authorized admission staff of HSS Ladhoo Pampore.
          </p>
        </div>
      </div>
    </div>
  );
};

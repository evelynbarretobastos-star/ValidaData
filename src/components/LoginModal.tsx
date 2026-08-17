import React, { useState } from 'react';
import { SystemUser } from '../types';
import { ShieldCheck, UserCheck, KeyRound, Lock, UserPlus, Store } from 'lucide-react';

interface LoginModalProps {
  users: SystemUser[];
  currentUser: SystemUser;
  onSelectUser: (user: SystemUser) => void;
  isOpen: boolean;
  onClose?: () => void;
  titleOverride?: string;
  requireSupervisorOnly?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentUser,
  onSelectUser,
  isOpen,
  onClose,
  titleOverride,
  requireSupervisorOnly = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const availableUsers = requireSupervisorOnly
    ? users.filter(u => u.role === 'SUPERVISOR' && u.active)
    : users.filter(u => u.active);

  const selectedUser = users.find(u => u.id === selectedUserId) || availableUsers[0];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedUser) {
      setErrorMessage('Selecione um usuário válido.');
      return;
    }

    if (pinInput.trim() !== selectedUser.pin) {
      setErrorMessage('Senha / PIN incorreto para este usuário!');
      return;
    }

    // Success login
    onSelectUser(selectedUser);
    setPinInput('');
    setErrorMessage('');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20 shadow-inner">
            <Store className="w-6 h-6 text-emerald-200" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            {titleOverride || 'Identificação do Usuário'}
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            {requireSupervisorOnly 
              ? 'Acesso restrito ao Supervisor. Insira seu PIN.' 
              : 'Selecione sua conta para registrar movimentações e validades'}
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-800 dark:bg-red-950 dark:text-red-200 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User selector list */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Selecione o Colaborador / Operador
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
              {availableUsers.map((u) => {
                const isSelected = selectedUserId === u.id;
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setErrorMessage('');
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.avatarColor || 'bg-emerald-700'} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{u.name}</span>
                          {u.role === 'SUPERVISOR' && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border border-amber-300">
                              Supervisor
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Matrícula: {u.code}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Senha / PIN de Acesso</span>
              <span className="text-[10px] text-slate-400 font-mono">Dica de teste: {selectedUser?.pin || '1234'}</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Insira o PIN (ex: 1234, 1111)"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-center tracking-widest text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition text-sm cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirmar Identificação</span>
            </button>
          </div>
        </form>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 text-center border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          Supervisores: <span className="font-mono text-slate-700 dark:text-slate-300">1234 (Roberto)</span>, <span className="font-mono text-slate-700 dark:text-slate-300">4321 (Ana)</span> | Operador: <span className="font-mono text-slate-700 dark:text-slate-300">1111 (Carlos)</span>
        </div>
      </div>
    </div>
  );
};

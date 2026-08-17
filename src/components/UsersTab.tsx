import React, { useState } from 'react';
import { SystemUser, UserRole } from '../types';
import { playSuccessBeep } from '../utils/sound';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  UserX, 
  UserCheck, 
  Trash2,
  Edit3,
  Hash,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';

interface UsersTabProps {
  users: SystemUser[];
  currentUser: SystemUser;
  onAddUser: (newUser: Omit<SystemUser, 'id'>) => void;
  onToggleUserActive: (userId: string) => void;
  onUpdateUserPin: (userId: string, newPin: string) => void;
  onDeleteUser: (userId: string) => void;
  onRequestSupervisorLogin: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  currentUser,
  onAddUser,
  onToggleUserActive,
  onUpdateUserPin,
  onDeleteUser,
  onRequestSupervisorLogin,
}) => {
  // Restricted access check
  if (currentUser.role !== 'SUPERVISOR') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center font-sans space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 p-8 rounded-2xl shadow-xl space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-xl font-black text-amber-950 dark:text-amber-100">
            Acesso Restrito: Gestão de Usuários
          </h2>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            O cadastro, alteração de senhas/PINs e remoção de colaboradores é de acesso exclusivo para o <strong>Supervisor</strong>.
          </p>
          <button
            onClick={onRequestSupervisorLogin}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Identificar-se como Supervisor (Senha / PIN)</span>
          </button>
        </div>
      </div>
    );
  }

  // Supervisor view for managing users
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [code, setCode] = useState(() => `OP-00${users.length + 1}`);
  const [pin, setPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editing PIN state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  // Delete User Confirmation state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Informe o nome do colaborador.');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErrorMsg('A senha/PIN deve ter pelo menos 4 dígitos.');
      return;
    }

    const avatarColors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-teal-600', 'bg-emerald-600'];
    const randomAvatar = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    onAddUser({
      name: name.trim(),
      code: code.trim() || `USR-${Math.floor(100 + Math.random() * 900)}`,
      role,
      pin: pin.trim(),
      active: true,
      avatarColor: randomAvatar,
    });

    playSuccessBeep();
    setSuccessMsg(`Colaborador "${name}" cadastrado com sucesso!`);
    setName('');
    setPin('');
    setCode(`OP-00${users.length + 2}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveNewPin = (userId: string) => {
    setPinErrorMsg('');
    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      setPinErrorMsg('A nova senha/PIN deve conter pelo menos 4 dígitos.');
      return;
    }

    onUpdateUserPin(userId, newPinInput.trim());
    playSuccessBeep();
    setEditingUserId(null);
    setNewPinInput('');
    setSuccessMsg('Senha / PIN alterado com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleConfirmDeleteUser = (userId: string) => {
    onDeleteUser(userId);
    playSuccessBeep();
    setDeletingUserId(null);
    setSuccessMsg('Usuário removido com sucesso!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="bg-emerald-800 text-white p-5 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <Users className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Aba de Gestão de Usuários
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              Cadastre colaboradores, altere senhas / PINs e remova acessos ao sistema
            </p>
          </div>
        </div>

        <div className="bg-emerald-950/70 border border-emerald-700 p-2 rounded-lg text-xs font-mono">
          Acesso Autorizado: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form: Add New User */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <UserPlus className="w-4 h-4 text-emerald-700" />
            <span>Cadastrar Novo Colaborador</span>
          </h3>

          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            
            {/* Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mateus Ferreira"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Cargo / Nível de Acesso
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  setRole(r);
                  setCode(r === 'SUPERVISOR' ? `SUP-00${users.length + 1}` : `OP-00${users.length + 1}`);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="OPERATOR">Operador (Caixa / Reposição / Estoque)</option>
                <option value="SUPERVISOR">Supervisor (Acesso Total / Gestão)</option>
              </select>
            </div>

            {/* Code */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Código de Matrícula
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: OP-005"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Senha / PIN de Acesso (4 a 6 dígitos)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ex: 5555"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Colaborador</span>
            </button>

          </form>
        </div>

        {/* List of Registered Users */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Usuários Cadastrados no Sistema ({users.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Opções de alteração de senha e remoção
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {users.map((u) => {
              const isEditingThisPin = editingUserId === u.id;
              const isDeletingThisUser = deletingUserId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition space-y-3 ${
                    u.active
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${u.avatarColor || 'bg-emerald-700'} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                          <span>{u.name}</span>
                          {u.role === 'SUPERVISOR' && (
                            <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border border-amber-300">
                              Supervisor
                            </span>
                          )}
                          {u.id === currentUser.id && (
                            <span className="bg-emerald-100 text-emerald-900 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border border-emerald-300">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Matrícula: <strong>{u.code}</strong> | Senha / PIN: <span className="font-bold tracking-widest text-slate-800 dark:text-slate-200">{u.pin}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      
                      {/* Alterar Senha / PIN Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingThisPin) {
                            setEditingUserId(null);
                          } else {
                            setEditingUserId(u.id);
                            setNewPinInput('');
                            setPinErrorMsg('');
                            setDeletingUserId(null);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                          isEditingThisPin
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title="Alterar Senha / PIN do usuário"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{isEditingThisPin ? 'Cancelar' : 'Alterar Senha'}</span>
                      </button>

                      {/* Toggle Active Status */}
                      <button
                        type="button"
                        onClick={() => onToggleUserActive(u.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          u.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border-slate-300'
                        }`}
                        title={u.active ? 'Desativar acesso' : 'Ativar acesso'}
                      >
                        {u.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>

                      {/* Remove / Delete User Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isDeletingThisUser) {
                            setDeletingUserId(null);
                          } else {
                            setDeletingUserId(u.id);
                            setEditingUserId(null);
                          }
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isDeletingThisUser
                            ? 'bg-red-700 text-white border-red-800'
                            : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-300 dark:border-slate-700'
                        }`}
                        title="Remover usuário do sistema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>

                  {/* Inline Change PIN Box */}
                  {isEditingThisPin && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 rounded-lg space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Nova Senha / PIN para {u.name}:</span>
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setEditingUserId(null)}
                          className="text-amber-800 hover:text-amber-900 text-xs font-bold"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {pinErrorMsg && (
                        <p className="text-[11px] font-bold text-red-700">{pinErrorMsg}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          maxLength={6}
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          placeholder="Digite a nova senha (4-6 dígitos)"
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded font-mono text-xs font-bold tracking-widest text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNewPin(u.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar Nova Senha</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Delete User Confirmation Box */}
                  {isDeletingThisUser && (
                    <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 p-3 rounded-lg space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 text-xs text-red-900 dark:text-red-200 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Deseja realmente remover o usuário "{u.name}" ({u.code}) do sistema?</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setDeletingUserId(null)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDeleteUser(u.id)}
                          className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sim, Remover Usuário</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};


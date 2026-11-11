import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { getINCoinsBalanceByPhone, getINCoinsHistoryByPhone, INCoinsBalance, INCoinsTransaction, walletPhone } from '../utils/incoins';

interface WalletState {
  balance: INCoinsBalance | null;
  transactions: INCoinsTransaction[];
  loading: boolean;
  balanceError: string;
  historyError: string;
  refresh: () => Promise<void>;
  clear: () => void;
}
let generation = 0;
let pending: Promise<void> | null = null;
const empty = { balance: null, transactions: [], loading: false, balanceError: '', historyError: '' };
export const useINCoinsStore = create<WalletState>((set) => ({
  ...empty,
  clear: () => { generation++; pending = null; set(empty); },
  refresh: () => {
    if (pending) return pending;
    const session = useAuthStore.getState();
    if (!session.isAuthenticated || session.isGuest || !session.token || !session.user?.phone) {
      set({ ...empty, balanceError: 'Please sign in to view your wallet.' });
      return Promise.resolve();
    }
    let phone: string;
    try { phone = walletPhone(session.user.phone); } catch (error: any) { set({ ...empty, balanceError: error.message }); return Promise.resolve(); }
    const current = generation;
    set({ loading: true, balanceError: '', historyError: '' });
    const work = (async () => {
      const [balance, history] = await Promise.allSettled([
        getINCoinsBalanceByPhone(phone, session.token!), getINCoinsHistoryByPhone(phone, session.token!),
      ]);
      if (generation !== current) return;
      set({ loading: false,
        balance: balance.status === 'fulfilled' ? balance.value : null,
        transactions: history.status === 'fulfilled' ? history.value.transactions : [],
        balanceError: balance.status === 'rejected' ? balance.reason?.message || 'Unable to load wallet.' : '',
        historyError: history.status === 'rejected' ? history.reason?.message || 'Unable to load history.' : '',
      });
    })().finally(() => { if (generation === current) pending = null; });
    pending = work;
    return work;
  },
}));
// No persisted private wallet data. Role changes retain the same wallet.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.phone !== previous.user?.phone || state.user?.id !== previous.user?.id || state.token !== previous.token || state.isAuthenticated !== previous.isAuthenticated || state.isGuest !== previous.isGuest) {
    useINCoinsStore.getState().clear();
  }
});

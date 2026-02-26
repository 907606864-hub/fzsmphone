import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: 'transfer' | 'redpacket' | 'topup' | 'withdraw' | 'other'
  description: string
  amount: number
  time: string
  relatedConversationId?: string
  relatedCharacterName?: string
}

export interface RedPacketData {
  id: string
  amount: number
  note: string
  sender: 'user' | 'character'
  senderName: string
  opened: boolean
  conversationId: string
  createdAt: string
}

export interface TransferData {
  id: string
  amount: number
  note: string
  direction: 'send' | 'receive'
  targetName: string
  accepted: boolean
  conversationId: string
  createdAt: string
}

const WALLET_KEY = 'wallet-data'
const TX_KEY = 'wallet-transactions'
const REDPACKET_KEY = 'wallet-redpackets'
const TRANSFER_KEY = 'wallet-transfers'

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(8888.88)
  const transactions = ref<Transaction[]>([])
  const redPackets = ref<RedPacketData[]>([])
  const transfers = ref<TransferData[]>([])

  // Load from localStorage
  function load() {
    try {
      const saved = localStorage.getItem(WALLET_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        balance.value = data.balance ?? 8888.88
      }
    } catch { /* ignore */ }

    try {
      const saved = localStorage.getItem(TX_KEY)
      if (saved) transactions.value = JSON.parse(saved)
    } catch { /* ignore */ }

    try {
      const saved = localStorage.getItem(REDPACKET_KEY)
      if (saved) redPackets.value = JSON.parse(saved)
    } catch { /* ignore */ }

    try {
      const saved = localStorage.getItem(TRANSFER_KEY)
      if (saved) transfers.value = JSON.parse(saved)
    } catch { /* ignore */ }
  }

  function saveBalance() {
    try {
      localStorage.setItem(WALLET_KEY, JSON.stringify({ balance: balance.value }))
    } catch { /* ignore */ }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(TX_KEY, JSON.stringify(transactions.value.slice(-200)))
    } catch { /* ignore */ }
  }

  function saveRedPackets() {
    try {
      localStorage.setItem(REDPACKET_KEY, JSON.stringify(redPackets.value.slice(-100)))
    } catch { /* ignore */ }
  }

  function saveTransfers() {
    try {
      localStorage.setItem(TRANSFER_KEY, JSON.stringify(transfers.value.slice(-100)))
    } catch { /* ignore */ }
  }

  function addTransaction(tx: Omit<Transaction, 'id' | 'time'>) {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleString('zh-CN'),
    }
    transactions.value.unshift(newTx)
    saveTransactions()
    return newTx
  }

  // 转账 - 发出
  function sendTransfer(
    amount: number,
    note: string,
    conversationId: string,
    targetName: string
  ): TransferData | null {
    if (amount <= 0 || amount > balance.value) return null

    balance.value = parseFloat((balance.value - amount).toFixed(2))
    saveBalance()

    const transfer: TransferData = {
      id: `tf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount,
      note: note || '转账',
      direction: 'send',
      targetName,
      accepted: false,
      conversationId,
      createdAt: new Date().toISOString(),
    }
    transfers.value.unshift(transfer)
    saveTransfers()

    addTransaction({
      type: 'expense',
      category: 'transfer',
      description: `转账给 ${targetName}`,
      amount,
      relatedConversationId: conversationId,
      relatedCharacterName: targetName,
    })

    return transfer
  }

  // 转账 - 对方"收下"（模拟）
  function acceptTransfer(transferId: string) {
    const tf = transfers.value.find(t => t.id === transferId)
    if (tf && !tf.accepted) {
      tf.accepted = true
      saveTransfers()
    }
  }

  // 发红包
  function sendRedPacket(
    amount: number,
    note: string,
    conversationId: string,
    senderName: string = '我'
  ): RedPacketData | null {
    if (amount <= 0 || amount > balance.value) return null

    balance.value = parseFloat((balance.value - amount).toFixed(2))
    saveBalance()

    const rp: RedPacketData = {
      id: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount,
      note: note || '恭喜发财，大吉大利',
      sender: 'user',
      senderName,
      opened: false,
      conversationId,
      createdAt: new Date().toISOString(),
    }
    redPackets.value.unshift(rp)
    saveRedPackets()

    addTransaction({
      type: 'expense',
      category: 'redpacket',
      description: `发红包 - ${note || '恭喜发财'}`,
      amount,
      relatedConversationId: conversationId,
    })

    return rp
  }

  // 领取红包（AI发的红包被用户领取）
  function openRedPacket(rpId: string): number {
    const rp = redPackets.value.find(r => r.id === rpId)
    if (!rp || rp.opened) return 0

    rp.opened = true
    saveRedPackets()

    balance.value = parseFloat((balance.value + rp.amount).toFixed(2))
    saveBalance()

    addTransaction({
      type: 'income',
      category: 'redpacket',
      description: `领取 ${rp.senderName} 的红包`,
      amount: rp.amount,
      relatedConversationId: rp.conversationId,
      relatedCharacterName: rp.senderName,
    })

    return rp.amount
  }

  // 充值
  function topUp(amount: number) {
    if (amount <= 0) return
    balance.value = parseFloat((balance.value + amount).toFixed(2))
    saveBalance()
    addTransaction({
      type: 'income',
      category: 'topup',
      description: '充值',
      amount,
    })
  }

  // 获取红包数据
  function getRedPacket(rpId: string): RedPacketData | undefined {
    return redPackets.value.find(r => r.id === rpId)
  }

  // 获取转账数据
  function getTransfer(tfId: string): TransferData | undefined {
    return transfers.value.find(t => t.id === tfId)
  }

  const recentTransactions = computed(() => {
    return transactions.value.slice(0, 10)
  })

  // 初始化加载
  load()

  return {
    balance,
    transactions,
    redPackets,
    transfers,
    recentTransactions,
    load,
    sendTransfer,
    acceptTransfer,
    sendRedPacket,
    openRedPacket,
    topUp,
    getRedPacket,
    getTransfer,
    addTransaction,
  }
})

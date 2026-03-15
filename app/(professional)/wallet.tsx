import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface CoinPackage {
  id: string
  name: string
  coins: number
  price_brl: number
  is_popular: boolean
}

interface Transaction {
  id: string
  type: 'credit' | 'debit' | 'bonus'
  amount: number
  description: string
  created_at: string
}

export default function WalletScreen() {
  const { profile } = useAuth()

  const [balance, setBalance] = useState<number>(0)
  const [packages, setPackages] = useState<CoinPackage[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!profile) return

    const [walletRes, packagesRes, txRes] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', profile.id).single(),
      supabase.from('coin_packages').select('*').order('coins', { ascending: true }),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    setBalance(walletRes.data?.balance ?? 0)
    setPackages(packagesRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [profile])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleBuyPackage(pkg: CoinPackage) {
    Alert.alert(
      'Em breve!',
      `O pagamento estará disponível na próxima versão.\n\nPacote: ${pkg.name} — ${pkg.coins} moedas por R$ ${pkg.price_brl.toFixed(2).replace('.', ',')}`,
      [{ text: 'OK' }]
    )
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  function transactionPrefix(type: Transaction['type']) {
    if (type === 'credit') return '+'
    if (type === 'debit') return '-'
    return '★'
  }

  function transactionColor(type: Transaction['type']) {
    if (type === 'credit') return 'text-green-600'
    if (type === 'debit') return 'text-red-500'
    return 'text-orange-500'
  }

  function transactionBg(type: Transaction['type']) {
    if (type === 'credit') return 'bg-green-50'
    if (type === 'debit') return 'bg-red-50'
    return 'bg-orange-50'
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor="#F97316" />}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-800">Carteira</Text>
          <Text className="text-gray-400 text-sm mt-1">Gerencie suas moedas</Text>
        </View>

        {/* Saldo atual */}
        <View className="mx-6 mb-6 bg-orange-500 rounded-2xl p-6 items-center">
          <Text className="text-white text-base font-medium opacity-80 mb-1">Saldo atual</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-white text-5xl font-bold">{balance}</Text>
            <Text className="text-white text-3xl">⬡</Text>
          </View>
          <Text className="text-orange-100 text-sm mt-2">moedas disponíveis</Text>
        </View>

        {/* Pacotes */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Comprar moedas</Text>
          <View className="gap-3">
            {packages.map(pkg => (
              <View
                key={pkg.id}
                className={`rounded-2xl p-4 ${pkg.is_popular ? 'border-2 border-orange-500 bg-orange-50' : 'border border-gray-200 bg-white'}`}
              >
                {pkg.is_popular && (
                  <View className="bg-orange-500 rounded-full px-3 py-0.5 self-start mb-2">
                    <Text className="text-white text-xs font-bold">Mais popular</Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-800 font-bold text-base">{pkg.name}</Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Text className="text-gray-600 text-sm">{pkg.coins} moedas</Text>
                      <Text className="text-gray-400 text-sm">⬡</Text>
                    </View>
                  </View>
                  <View className="items-end gap-2">
                    <Text className="text-gray-800 font-bold text-base">
                      R$ {pkg.price_brl.toFixed(2).replace('.', ',')}
                    </Text>
                    <TouchableOpacity
                      className={`rounded-xl px-4 py-2 ${pkg.is_popular ? 'bg-orange-500' : 'bg-gray-800'}`}
                      onPress={() => handleBuyPackage(pkg)}
                    >
                      <Text className="text-white font-semibold text-sm">Comprar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Histórico */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-gray-800 mb-3">Histórico</Text>
          {transactions.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center">
              <Text className="text-gray-400 text-sm text-center">Nenhuma transação ainda.</Text>
            </View>
          ) : (
            <View className="gap-2">
              {transactions.map(tx => (
                <View key={tx.id} className={`rounded-xl p-3 flex-row items-center justify-between ${transactionBg(tx.type)}`}>
                  <View className="flex-1 pr-3">
                    <Text className="text-gray-700 text-sm font-medium" numberOfLines={1}>{tx.description}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{formatDate(tx.created_at)}</Text>
                  </View>
                  <Text className={`font-bold text-base ${transactionColor(tx.type)}`}>
                    {transactionPrefix(tx.type)}{tx.amount} ⬡
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

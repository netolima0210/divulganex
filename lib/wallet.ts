import { supabase } from './supabase'

export async function getWalletBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single()
  return data?.balance ?? 0
}

export async function debitWallet(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (!wallet || wallet.balance < amount) {
    return { success: false, newBalance: wallet?.balance ?? 0, error: 'Saldo insuficiente' }
  }

  const { error: updateError } = await supabase
    .from('wallets')
    .update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updateError) return { success: false, newBalance: wallet.balance, error: updateError.message }

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'debit',
    amount,
    description,
    reference_id: referenceId ?? null,
  })

  return { success: true, newBalance: wallet.balance - amount }
}

import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  ShieldCheck,
  RefreshCw,
  QrCode,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  Zap,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react'
import type {
  Receivable,
  PaymentMethod,
  SimulatePaymentPayload,
  SimulatePaymentResponse,
} from '@/types'

interface PaymentSimulatorCardProps {
  receivables: Receivable[]
  preselectedReceivable?: Receivable | null
}

export const PaymentSimulatorCard: React.FC<PaymentSimulatorCardProps> = ({
  receivables,
  preselectedReceivable,
}) => {
  const queryClient = useQueryClient()

  // Filtra apenas contas que ainda possuem saldo a pagar
  const eligibleReceivables = receivables.filter(
    (r) => r.status !== 'Paid' && r.status !== 'Cancelled' && r.remainingAmountCents > 0
  )

  const [selectedId, setSelectedId] = useState<string>(
    preselectedReceivable?.id || eligibleReceivables[0]?.id || ''
  )
  const [amountInput, setAmountInput] = useState<string>('')
  const [method, setMethod] = useState<PaymentMethod>('Pix')
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')
  const [copiedPix, setCopiedPix] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulatePaymentResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentReceivable = receivables.find((r) => r.id === selectedId)

  // Gera chave de idempotência padrão ao carregar
  const generateNewKey = () => {
    const key = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setIdempotencyKey(key)
    return key
  }

  useEffect(() => {
    if (!idempotencyKey) {
      generateNewKey()
    }
  }, [])

  useEffect(() => {
    if (preselectedReceivable) {
      setSelectedId(preselectedReceivable.id)
      setAmountInput((preselectedReceivable.remainingAmountCents / 100).toFixed(2))
    } else if (currentReceivable) {
      setAmountInput((currentReceivable.remainingAmountCents / 100).toFixed(2))
    }
  }, [selectedId, preselectedReceivable])

  const simulateMutation = useMutation({
    mutationFn: (payload: SimulatePaymentPayload) =>
      api.post<SimulatePaymentResponse>('/finance/simulate-payment', payload),
    onSuccess: (data) => {
      setSimulationResult(data)
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Falha na simulação de pagamento.')
    },
  })

  const handleSimulate = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!currentReceivable) {
      setErrorMessage('Selecione uma conta a receber válida para simular o pagamento.')
      return
    }

    const parsed = parseFloat(amountInput.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMessage('Informe um valor de liquidação válido maior que zero.')
      return
    }

    const amountCents = Math.round(parsed * 100)
    if (amountCents > currentReceivable.remainingAmountCents) {
      setErrorMessage(
        `O valor informado excede o saldo restante de ${formatCurrency(
          currentReceivable.remainingAmountCents
        )}.`
      )
      return
    }

    simulateMutation.mutate({
      receivableId: currentReceivable.id,
      amountCents,
      method,
      idempotencyKey: idempotencyKey.trim(),
      notes: 'Executado via Simulador Financeiro ServiCore',
      cardNumberMock: method === 'CreditCard' ? '4111********1111' : undefined,
    })
  }

  const handleCopyPix = () => {
    if (simulationResult?.pixQrCodePayload) {
      navigator.clipboard.writeText(simulationResult.pixQrCodePayload)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2500)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Explicativo sobre Idempotência */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#18212B] via-[#111820] to-[#18212B] border border-[#273340] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F1F5F9]">
                Simulador de Pagamentos com Idempotência Estrita
              </h3>
              <Badge variant="sky">Garantia Transacional</Badge>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              O motor de pagamentos utiliza o padrão <strong>Idempotency-Key</strong>. Se o cliente
              submeter a mesma requisição repetidas vezes (clique duplo, reenvio de webhook ou queda
              de rede), o sistema <strong>nunca duplica débitos</strong>, retornando o comprovante
              original de forma segura.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={generateNewKey}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Nova Chave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Controle da Simulação */}
        <div className="lg:col-span-6 bg-[#111820] border border-[#273340] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#273340]">
            <Zap className="w-4 h-4 text-[#FBBF24]" />
            <h4 className="text-sm font-bold text-[#F1F5F9]">Parâmetros do Pagamento</h4>
          </div>

          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSimulate} className="space-y-4">
            {/* Seleção de Conta a Receber */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Conta a Receber Alvo *
              </label>
              {eligibleReceivables.length === 0 ? (
                <div className="p-3 bg-[#0B0F14] border border-[#273340] rounded-lg text-xs text-[#94A3B8]">
                  Não há faturas em aberto para simular baixas. Crie uma nova conta a receber na aba correspondente.
                </div>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
                >
                  {eligibleReceivables.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} — Restante: {formatCurrency(r.remainingAmountCents)} ({r.customerName})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Informações da Conta Selecionada */}
            {currentReceivable && (
              <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#273340] grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-[#94A3B8]">Cliente</span>
                  <div className="font-semibold text-[#F1F5F9] truncate">
                    {currentReceivable.customerName}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#94A3B8]">Total da Conta</span>
                  <div className="font-semibold text-[#F1F5F9]">
                    {formatCurrency(currentReceivable.amountCents)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#94A3B8]">Saldo a Pagar</span>
                  <div className="font-bold text-[#38BDF8]">
                    {formatCurrency(currentReceivable.remainingAmountCents)}
                  </div>
                </div>
              </div>
            )}

            {/* Valor da Simulação */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Valor da Simulação (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">R$</span>
                <input
                  type="text"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                  required
                />
              </div>

              {currentReceivable && currentReceivable.remainingAmountCents > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAmountInput((currentReceivable.remainingAmountCents / 100).toFixed(2))
                    }
                    className="text-[11px] px-2 py-0.5 rounded bg-[#273340]/60 hover:bg-[#38BDF8]/20 hover:text-[#38BDF8] text-[#94A3B8] transition-colors"
                  >
                    Quitar Total ({formatCurrency(currentReceivable.remainingAmountCents)})
                  </button>
                  {currentReceivable.remainingAmountCents > 200 && (
                    <button
                      type="button"
                      onClick={() =>
                        setAmountInput(
                          (currentReceivable.remainingAmountCents / 200).toFixed(2)
                        )
                      }
                      className="text-[11px] px-2 py-0.5 rounded bg-[#273340]/60 hover:bg-[#38BDF8]/20 hover:text-[#38BDF8] text-[#94A3B8] transition-colors"
                    >
                      50% ({formatCurrency(currentReceivable.remainingAmountCents / 2)})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Método de Pagamento */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                Método de Simulação
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('Pix')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                    method === 'Pix'
                      ? 'border-[#38BDF8] bg-[#38BDF8]/10 text-[#38BDF8]'
                      : 'border-[#273340] bg-[#0B0F14] text-[#94A3B8] hover:border-[#38BDF8]/40'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Pix Instantâneo
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CreditCard')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                    method === 'CreditCard'
                      ? 'border-[#A78BFA] bg-[#A78BFA]/10 text-[#A78BFA]'
                      : 'border-[#273340] bg-[#0B0F14] text-[#94A3B8] hover:border-[#A78BFA]/40'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Cartão de Crédito
                </button>
              </div>
            </div>

            {/* Chave de Idempotência */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#94A3B8]">
                  Chave de Idempotência (Idempotency-Key) *
                </label>
                <span className="text-[10px] text-[#38BDF8]">Garantia anti-duplicação</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateNewKey}
                  title="Gerar nova chave única"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={!currentReceivable}
                isLoading={simulateMutation.isPending}
                leftIcon={<Sparkles className="w-4 h-4 text-[#38BDF8]" />}
              >
                Executar Simulação
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!simulationResult || simulateMutation.isPending}
                onClick={() => handleSimulate()}
                title="Reenvia a requisição com a mesma IdempotencyKey para provar que não há duplicação"
                leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#FBBF24]" />}
              >
                Testar Replay (Mesma Chave)
              </Button>
            </div>
          </form>
        </div>

        {/* Painel do Comprovante / Recibo Financeiro */}
        <div className="lg:col-span-6 bg-[#111820] border border-[#273340] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#273340]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                <h4 className="text-sm font-bold text-[#F1F5F9]">
                  Comprovante de Transação Financeira
                </h4>
              </div>
              {simulationResult && (
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  {simulationResult.receiptId}
                </span>
              )}
            </div>

            {!simulationResult ? (
              <div className="py-16 text-center text-xs text-[#94A3B8] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#18212B] flex items-center justify-center mx-auto text-[#64748B]">
                  <QrCode className="w-6 h-6" />
                </div>
                <p className="font-semibold text-[#CBD5E1]">Nenhuma simulação executada ainda</p>
                <p className="text-[11px] text-[#64748B] max-w-xs mx-auto">
                  Preencha os parâmetros ao lado e clique em &ldquo;Executar Simulação&rdquo; para
                  gerar o comprovante idempotente com registro em tempo real.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4 animate-in fade-in">
                {/* Banner de Status Idempotente */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                    simulationResult.isIdempotentReplay
                      ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]'
                      : 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold">
                        {simulationResult.isIdempotentReplay
                          ? 'REPLAY IDEMPOTENTE DETECTADO'
                          : 'TRANSAÇÃO AUTORIZADA & QUITADA'}
                      </span>
                      <p className="text-[11px] opacity-90">{simulationResult.message}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhes do Comprovante */}
                <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#273340] space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#273340]/40">
                    <span className="text-[#94A3B8]">Valor Liquidado:</span>
                    <span className="font-bold text-base text-[#34D399]">
                      {formatCurrency(simulationResult.amountPaidCents)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#273340]/40">
                    <span className="text-[#94A3B8]">Conta Faturada:</span>
                    <span className="font-semibold text-[#F1F5F9]">
                      {simulationResult.receivableTitle}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#273340]/40">
                    <span className="text-[#94A3B8]">Cliente:</span>
                    <span className="text-[#F1F5F9]">{simulationResult.customerName}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#273340]/40">
                    <span className="text-[#94A3B8]">Método:</span>
                    <span className="text-[#38BDF8] font-medium">
                      {simulationResult.paymentMethodName}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#273340]/40">
                    <span className="text-[#94A3B8]">Código de Autorização:</span>
                    <span className="font-mono text-[#F1F5F9]">
                      {simulationResult.transactionAuthorizationCode}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#273340]/40">
                    <span className="text-[#94A3B8]">Saldo Restante na Conta:</span>
                    <span className="font-semibold text-[#F1F5F9]">
                      {formatCurrency(simulationResult.remainingBalanceCents)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#94A3B8]">Data/Hora Processamento:</span>
                    <span className="text-[#94A3B8]">
                      {formatDateTime(simulationResult.processedAtUtc)}
                    </span>
                  </div>
                </div>

                {/* Se Pix: QR Code e Código Copia-e-Cola */}
                {simulationResult.pixQrCodePayload && (
                  <div className="p-3 bg-[#0B0F14] border border-[#273340] rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-[#F1F5F9]">Pix Copia e Cola Gerado</div>
                        <p className="text-[11px] font-mono text-[#94A3B8] truncate max-w-[200px] sm:max-w-xs">
                          {simulationResult.pixQrCodePayload}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPix}
                      leftIcon={
                        copiedPix ? (
                          <Check className="w-3.5 h-3.5 text-[#34D399]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {copiedPix ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#273340] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>ServiCore Idempotent Settlement Engine</span>
            <span>200 OK &bull; Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}

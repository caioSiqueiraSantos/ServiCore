import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import {
  X,
  User,
  Building2,
  Mail,
  MessageSquare,
  Edit2,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Wallet,
} from 'lucide-react'
import type { Customer } from '@/types'

interface CustomerDetailsDrawerProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onEdit: (customer: Customer) => void
  onToggleStatus: (customer: Customer) => void
}

export const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  if (!isOpen || !customer) return null

  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : null
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá ${customer.name}, tudo bem? Entramos em contato a respeito da prestação de serviços.`
      )}`
    : null

  const formatDoc = (doc?: string) => {
    if (!doc) return 'Não informado'
    const clean = doc.replace(/\D/g, '')
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
    }
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
    }
    return doc
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0E1017] border-l border-[#1E2332] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Cabeçalho do Drawer */}
        <div className="p-5 border-b border-[#1E2332] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#161A26] border border-[#282F44] flex items-center justify-center text-[#38BDF8]">
              {customer.type === 'Company' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F5] leading-tight">
                {customer.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={customer.type === 'Company' ? 'sky' : 'default'} className="text-[10px]">
                  {customer.type === 'Company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </Badge>
                <Badge
                  variant={customer.status === 'Active' ? 'positive' : 'critical'}
                  dot
                  className="text-[10px]"
                >
                  {customer.status === 'Active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Ações Rápidas de Contato */}
          <div className="grid grid-cols-2 gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#34D399] border border-[#10B981]/30 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="py-2 px-3 rounded-lg bg-[#131620] text-[#64748B] border border-[#1E2332] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Sem WhatsApp</span>
              </button>
            )}

            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="py-2 px-3 rounded-lg bg-[#1D68F2]/15 hover:bg-[#1D68F2]/25 text-[#38BDF8] border border-[#1D68F2]/30 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Enviar E-mail</span>
              </a>
            ) : (
              <button
                disabled
                className="py-2 px-3 rounded-lg bg-[#131620] text-[#64748B] border border-[#1E2332] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sem E-mail</span>
              </button>
            )}
          </div>

          {/* Dados Cadastrais */}
          <div className="space-y-3 p-4 rounded-xl bg-[#11131C] border border-[#1E2332]">
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
              Dados Cadastrais
            </p>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-[#1E2332]/50">
                <span className="text-[#8E9CAE]">
                  {customer.type === 'Individual' ? 'CPF' : 'CNPJ'}:
                </span>
                <span className="font-mono text-[#F4F4F5] font-medium">
                  {formatDoc(customer.document)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#1E2332]/50">
                <span className="text-[#8E9CAE]">E-mail:</span>
                <span className="text-[#F4F4F5] truncate max-w-[200px]">
                  {customer.email || 'Não informado'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#1E2332]/50">
                <span className="text-[#8E9CAE]">Telefone:</span>
                <span className="text-[#F4F4F5] font-mono">
                  {customer.phone || 'Não informado'}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[#8E9CAE]">Cliente desde:</span>
                <span className="text-[#F4F4F5]">{formatDate(customer.createdAtUtc)}</span>
              </div>
            </div>
          </div>

          {/* Observações */}
          {customer.notes && (
            <div className="space-y-2 p-4 rounded-xl bg-[#11131C] border border-[#1E2332]">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                Observações
              </p>
              <p className="text-[#8E9CAE] leading-relaxed whitespace-pre-wrap">
                {customer.notes}
              </p>
            </div>
          )}

          {/* Módulos Relacionados (Preparação para Etapas 3 e 4) */}
          <div className="space-y-3 p-4 rounded-xl bg-[#11131C] border border-[#1E2332]">
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
              Histórico Operacional & Financeiro
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161A26] border border-[#1E2332]">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#38BDF8]" />
                  <span className="text-[#8E9CAE]">Contratos Ativos:</span>
                </div>
                <Badge variant="default" className="text-[10px]">
                  Etapa 3
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161A26] border border-[#1E2332]">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#8E9CAE]">Saldo Faturado:</span>
                </div>
                <Badge variant="default" className="text-[10px]">
                  Etapa 4
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Drawer com Ações */}
        <div className="p-4 border-t border-[#1E2332] flex items-center justify-between gap-2 bg-[#0A0C12]">
          <button
            type="button"
            onClick={() => onToggleStatus(customer)}
            className="text-xs text-[#8E9CAE] hover:text-[#EF4444] transition-colors flex items-center gap-1.5"
          >
            {customer.status === 'Active' ? (
              <>
                <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Inativar</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Ativar</span>
              </>
            )}
          </button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => onEdit(customer)}
          >
            Editar Cliente
          </Button>
        </div>
      </div>
    </div>
  )
}

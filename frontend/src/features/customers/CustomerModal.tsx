import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, User, Building2, Phone, Mail, FileText, AlertCircle } from 'lucide-react'
import type { Customer, CustomerType, CustomerStatus, CreateCustomerPayload, UpdateCustomerPayload } from '@/types'

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customerToEdit?: Customer | null
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const queryClient = useQueryClient()

  const [type, setType] = useState<CustomerType>('Individual')
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<CustomerStatus>('Active')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customerToEdit) {
      setType(customerToEdit.type)
      setName(customerToEdit.name)
      setDocument(customerToEdit.document || '')
      setEmail(customerToEdit.email || '')
      setPhone(customerToEdit.phone || '')
      setNotes(customerToEdit.notes || '')
      setStatus(customerToEdit.status)
    } else {
      setType('Individual')
      setName('')
      setDocument('')
      setEmail('')
      setPhone('')
      setNotes('')
      setStatus('Active')
    }
    setError(null)
  }, [customerToEdit, isOpen])

  // Máscaras visuais automáticas
  const handleDocumentChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (type === 'Individual') {
      // CPF: 000.000.000-00 (max 11 dígitos)
      const limited = digits.slice(0, 11)
      if (limited.length <= 3) setDocument(limited)
      else if (limited.length <= 6) setDocument(`${limited.slice(0, 3)}.${limited.slice(3)}`)
      else if (limited.length <= 9) setDocument(`${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`)
      else setDocument(`${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`)
    } else {
      // CNPJ: 00.000.000/0000-00 (max 14 dígitos)
      const limited = digits.slice(0, 14)
      if (limited.length <= 2) setDocument(limited)
      else if (limited.length <= 5) setDocument(`${limited.slice(0, 2)}.${limited.slice(2)}`)
      else if (limited.length <= 8) setDocument(`${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`)
      else if (limited.length <= 12) setDocument(`${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`)
      else setDocument(`${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`)
    }
  }

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) setPhone(digits ? `(${digits}` : '')
    else if (digits.length <= 6) setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`)
    else if (digits.length <= 10) setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`)
    else setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('O nome do cliente é obrigatório.')
      }

      if (customerToEdit) {
        const payload: UpdateCustomerPayload = {
          name: name.trim(),
          type,
          document: document ? document.replace(/\D/g, '') : undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          status,
        }
        return api.put<Customer>(`/customers/${customerToEdit.id}`, payload)
      } else {
        const payload: CreateCustomerPayload = {
          name: name.trim(),
          type,
          document: document ? document.replace(/\D/g, '') : undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }
        return api.post<Customer>('/customers', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.errors && err.errors.length > 0) {
        setError(`${err.message} (${err.errors.join(', ')})`)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocorreu um erro ao salvar o cliente.')
      }
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0E1017] border border-[#1E2332] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2332]">
          <div>
            <h3 className="text-sm font-semibold text-[#F4F4F5]">
              {customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <p className="text-xs text-[#8E9CAE]">
              {customerToEdit ? 'Atualize as informações cadastrais do cliente' : 'Cadastre um novo cliente Pessoa Física ou Jurídica'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/25 flex items-start gap-2.5 text-xs text-[#F87171]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-4"
        >
          {/* Seletor PF / PJ */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8E9CAE]">Tipo de Pessoa</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('Individual')
                  setDocument('')
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  type === 'Individual'
                    ? 'bg-[#1D68F2]/15 border-[#1D68F2] text-[#38BDF8]'
                    : 'bg-[#131620] border-[#1E2332] text-[#8E9CAE] hover:border-[#2C3347]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pessoa Física (PF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('Company')
                  setDocument('')
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  type === 'Company'
                    ? 'bg-[#1D68F2]/15 border-[#1D68F2] text-[#38BDF8]'
                    : 'bg-[#131620] border-[#1E2332] text-[#8E9CAE] hover:border-[#2C3347]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Pessoa Jurídica (PJ)</span>
              </button>
            </div>
          </div>

          {/* Nome / Razão Social */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8E9CAE]">
              {type === 'Individual' ? 'Nome Completo *' : 'Razão Social / Nome Fantasia *'}
            </label>
            <Input
              type="text"
              placeholder={type === 'Individual' ? 'Ex: Carlos Alberto Silva' : 'Ex: Studio Alfa Arquitetura Ltda'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Documento (CPF / CNPJ) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8E9CAE]">
              {type === 'Individual' ? 'CPF' : 'CNPJ'}
            </label>
            <Input
              type="text"
              placeholder={type === 'Individual' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={document}
              onChange={(e) => handleDocumentChange(e.target.value)}
            />
          </div>

          {/* Contato (E-mail e Telefone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8E9CAE]">E-mail</label>
              <Input
                type="email"
                placeholder="contato@cliente.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8E9CAE]">Telefone / WhatsApp</label>
              <Input
                type="text"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8E9CAE]">Observações Internas</label>
            <textarea
              rows={3}
              placeholder="Informações adicionais, preferências de contato, endereço, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-[#131620] border border-[#1E2332] px-3.5 py-2 text-xs text-[#F4F4F5] placeholder-[#64748B] focus:outline-none focus:border-[#2C3347] transition-colors resize-none"
            />
          </div>

          {/* Status (ao editar) */}
          {customerToEdit && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-[#8E9CAE]">Situação Cadastral</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[#F4F4F5] cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'Active'}
                    onChange={() => setStatus('Active')}
                    className="accent-[#10B981]"
                  />
                  <span>Ativo</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#8E9CAE] cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'Inactive'}
                    onChange={() => setStatus('Inactive')}
                    className="accent-[#EF4444]"
                  />
                  <span>Inativo</span>
                </label>
              </div>
            </div>
          )}

          {/* Rodapé com Ações */}
          <div className="pt-3 border-t border-[#1E2332] flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              {customerToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { User, Mail, Lock, Building2, Briefcase, AlertCircle } from 'lucide-react'
import type { WorkspaceType } from '@/types'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('Individual')
  const [document, setDocument] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName || !email || !password || !workspaceName) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve possuir pelo menos 6 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      await register({
        fullName,
        email,
        password,
        workspaceName,
        workspaceType,
        document: document || undefined,
      })
      navigate('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocorreu um erro ao criar a conta. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090A0F] text-[#F4F4F5]">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(29,104,242,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10 py-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size="lg" showBadge subtitle="Criação de Workspace" />
          <h2 className="text-xl font-bold tracking-tight text-[#F4F4F5] mt-4">
            Comece a usar o ServiCore
          </h2>
          <p className="text-xs text-[#8E9CAE]">
            Configure seu perfil e o ambiente de trabalho da sua atividade profissional
          </p>
        </div>

        <Card className="border-[#1E2332] bg-[#0E1017]/90 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/25 flex items-start gap-2.5 text-xs text-[#F87171]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seção Pessoal */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  1. Seus Dados de Acesso
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E9CAE]">Nome Completo *</label>
                  <Input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<User className="w-4 h-4" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8E9CAE]">E-mail *</label>
                    <Input
                      type="email"
                      placeholder="joao@servico.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<Mail className="w-4 h-4" />}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8E9CAE]">Senha *</label>
                    <Input
                      type="password"
                      placeholder="Mín. 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Seção do Workspace */}
              <div className="space-y-3 pt-2 border-t border-[#1E2332]">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  2. Seu Ambiente de Trabalho
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E9CAE]">
                    Nome do Workspace / Atividade *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Studio Alfa ou Silva Consultoria"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    leftIcon={<Building2 className="w-4 h-4" />}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E9CAE]">Tipo de Atuação</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWorkspaceType('Individual')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        workspaceType === 'Individual'
                          ? 'bg-[#1D68F2]/15 border-[#1D68F2] text-[#38BDF8]'
                          : 'bg-[#131620] border-[#1E2332] text-[#8E9CAE] hover:border-[#2C3347]'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Profissional Autônomo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkspaceType('Enterprise')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        workspaceType === 'Enterprise'
                          ? 'bg-[#1D68F2]/15 border-[#1D68F2] text-[#38BDF8]'
                          : 'bg-[#131620] border-[#1E2332] text-[#8E9CAE] hover:border-[#2C3347]'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Pequena Empresa</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E9CAE]">
                    CPF ou CNPJ (Opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Apenas números"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-10 text-xs font-semibold mt-4"
                isLoading={isSubmitting}
              >
                Criar Workspace e Começar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#8E9CAE]">
          Já possui uma conta?{' '}
          <Link
            to="/login"
            className="text-[#38BDF8] hover:text-[#00D2FF] font-medium transition-colors"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}

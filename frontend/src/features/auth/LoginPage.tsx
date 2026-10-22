import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Lock, Mail, Sparkles, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    try {
      setIsSubmitting(true)
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Falha ao autenticar. Verifique suas credenciais.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('demo@servicore.com.br')
    setPassword('Senha123!')
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090A0F] text-[#F4F4F5]">
      {/* Background radial glow sutil */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(29,104,242,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size="lg" showBadge subtitle="Gestão Operacional & Financeira" />
          <h2 className="text-xl font-bold tracking-tight text-[#F4F4F5] mt-4">
            Acesse seu workspace
          </h2>
          <p className="text-xs text-[#8E9CAE]">
            Gerencie contratos, clientes e faturamento em um único lugar
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8E9CAE]">E-mail</label>
                <Input
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#8E9CAE]">Senha</label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-10 text-xs font-semibold"
                isLoading={isSubmitting}
              >
                Entrar no ServiCore
              </Button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#1E2332]"></div>
              <span className="flex-shrink mx-3 text-[10px] text-[#64748B] uppercase tracking-wider">
                Ambiente de Demonstração
              </span>
              <div className="flex-grow border-t border-[#1E2332]"></div>
            </div>

            {/* Botão de Preenchimento Automático para Teste Rápido */}
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2 px-3 rounded-lg bg-[#131620] hover:bg-[#181C28] border border-[#1E2332] hover:border-[#2C3347] text-xs text-[#94A3B8] hover:text-[#F4F4F5] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Usar credenciais demonstrativas (Caio Consultor)</span>
            </button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#8E9CAE]">
          Não possui um workspace?{' '}
          <Link
            to="/cadastro"
            className="text-[#38BDF8] hover:text-[#00D2FF] font-medium transition-colors"
          >
            Cadastre-se gratuitamente
          </Link>
        </p>
      </div>
    </div>
  )
}

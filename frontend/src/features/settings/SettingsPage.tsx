import { Server, Database, Shield, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SystemStatusDto } from '@/types'
import { formatDateTime } from '@/lib/utils'

export const SettingsPage: React.FC = () => {
  const { data: systemInfo, isLoading } = useQuery<SystemStatusDto>({
    queryKey: ['system-info'],
    queryFn: () => api.get<SystemStatusDto>('/health/system'),
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#F1F5F9]">Configurações do Ambiente</h2>
          <Badge variant="sky">Sistema</Badge>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">
          Parâmetros do workspace, perfil operacional e diagnóstico técnico da infraestrutura do ServiCore.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Workspace Atual</CardTitle>
              <Shield className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <CardDescription>Parâmetros do ambiente de trabalho ativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Nome do Workspace:</span>
              <span className="font-semibold text-[#F1F5F9]">Consultoria & Projetos</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Modalidade:</span>
              <Badge variant="sky" className="text-[10px]">Autônomo / Individual</Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Isolamento de Dados:</span>
              <span className="text-[#34D399] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ativo por WorkspaceId
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#94A3B8]">Usuários vinculados:</span>
              <span className="text-[#F1F5F9] font-medium">1 (Proprietário)</span>
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico da API e Persistência */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Diagnóstico Técnico</CardTitle>
              <Server className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <CardDescription>Conectividade com backend .NET e SQLite</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Servidor Backend:</span>
              <span className="font-semibold text-[#F1F5F9]">
                {isLoading ? 'Verificando...' : systemInfo?.appName || 'ASP.NET Core Web API'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Banco de Dados:</span>
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                <Database className="w-3 h-3 text-[#38BDF8]" />
                {systemInfo?.databaseProvider || 'SQLite (EF Core)'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Status de Conexão:</span>
              <Badge variant={systemInfo?.databaseCanConnect ? 'positive' : 'warning'} dot className="text-[10px]">
                {systemInfo?.databaseCanConnect ? 'Conectado ao SQLite' : 'Standby / Conectando'}
              </Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#94A3B8]">Horário UTC do Servidor:</span>
              <span className="text-[#F1F5F9]">
                {systemInfo?.serverTimeUtc ? formatDateTime(systemInfo.serverTimeUtc) : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

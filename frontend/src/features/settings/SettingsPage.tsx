import React, { useState } from 'react'
import { Server, Database, Shield, CheckCircle2, History, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SystemStatusDto, AuditLog } from '@/types'
import { formatDateTime } from '@/lib/utils'

export const SettingsPage: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('')

  const { data: systemInfo, isLoading: isSystemLoading } = useQuery<SystemStatusDto>({
    queryKey: ['system-info'],
    queryFn: () => api.get<SystemStatusDto>('/health/system'),
  })

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', selectedEntity],
    queryFn: () =>
      api.get<AuditLog[]>(`/audit-logs${selectedEntity ? `?entityName=${encodeURIComponent(selectedEntity)}` : ''}`),
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#F1F5F9]">Configurações & Auditoria</h2>
          <Badge variant="sky">Sistema</Badge>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">
          Parâmetros operacionais do workspace, diagnóstico de infraestrutura e trilha completa de auditoria imutável.
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
            <CardDescription>Conectividade com backend .NET e Banco de Dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Servidor Backend:</span>
              <span className="font-semibold text-[#F1F5F9]">
                {isSystemLoading ? 'Verificando...' : systemInfo?.appName || 'ASP.NET Core Web API'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Banco de Dados:</span>
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                <Database className="w-3 h-3 text-[#38BDF8]" />
                {systemInfo?.databaseProvider || 'SQLite / PostgreSQL (EF Core)'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#273340]/50">
              <span className="text-[#94A3B8]">Status de Conexão:</span>
              <Badge variant={systemInfo?.databaseCanConnect ? 'positive' : 'warning'} dot className="text-[10px]">
                {systemInfo?.databaseCanConnect ? 'Conectado e Operacional' : 'Standby / Conectando'}
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

      {/* Trilha de Auditoria Completa */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#38BDF8]" />
              <div>
                <CardTitle className="text-base">Trilha de Auditoria & Segurança</CardTitle>
                <CardDescription>Registros de criação, mutações e eventos de negócio auditados</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#64748B]" />
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="bg-[#11131C] border border-[#1E2332] text-xs text-[#F4F4F5] rounded-md px-2.5 py-1 focus:border-[#38BDF8] focus:outline-none"
              >
                <option value="">Todas as entidades</option>
                <option value="Customer">Clientes</option>
                <option value="Contract">Contratos</option>
                <option value="Receivable">Contas a Receber</option>
                <option value="Payment">Pagamentos</option>
                <option value="Expense">Despesas</option>
                <option value="TaskItem">Tarefas</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAuditLoading ? (
            <div className="py-8 text-center text-xs text-[#64748B]">Carregando trilha de auditoria...</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              Nenhum registro de auditoria encontrado para o filtro selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-[#64748B] border-b border-[#1E2332]">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Ação</th>
                    <th className="py-2.5 px-3">Entidade</th>
                    <th className="py-2.5 px-3">Usuário</th>
                    <th className="py-2.5 px-3">ID do Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2332]/50 font-mono-numbers">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#11131C]/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#8E9CAE]">
                        {formatDateTime(log.timestampUtc)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            log.action.includes('Create')
                              ? 'positive'
                              : log.action.includes('Delete')
                              ? 'critical'
                              : 'sky'
                          }
                          className="text-[10px] py-0 px-1.5 font-mono"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[#F4F4F5] font-sans font-medium">
                        {log.entityName}
                      </td>
                      <td className="py-2.5 px-3 text-[#8E9CAE] font-sans">
                        {log.userFullName || 'Sistema'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B]">
                        {log.entityId.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

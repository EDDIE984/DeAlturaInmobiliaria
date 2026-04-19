interface AgentStat {
  id: string
  name: string
  total_leads: number
  ventas: number
  no_ventas: number
  tasa_conversion: number
  sin_gestionar: number
  seguimientos_pendientes: number
}

interface Props {
  agents: AgentStat[]
}

export default function AgentsTable({ agents }: Props) {
  if (agents.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">Sin agentes activos</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-5 py-3 text-left">#</th>
            <th className="px-5 py-3 text-left">Agente</th>
            <th className="px-5 py-3 text-right">Leads</th>
            <th className="px-5 py-3 text-right">Ventas</th>
            <th className="px-5 py-3 text-right">No ventas</th>
            <th className="px-5 py-3 text-right">Conversión</th>
            <th className="px-5 py-3 text-right">Sin gestionar</th>
            <th className="px-5 py-3 text-right">Seg. pend.</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent, i) => (
            <tr key={agent.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
              <td className="px-5 py-3 font-medium text-gray-800">{agent.name}</td>
              <td className="px-5 py-3 text-right text-gray-700">{agent.total_leads}</td>
              <td className="px-5 py-3 text-right">
                <span className="text-green-600 font-semibold">{agent.ventas}</span>
              </td>
              <td className="px-5 py-3 text-right text-red-500">{agent.no_ventas}</td>
              <td className="px-5 py-3 text-right">
                <span
                  className={`font-semibold ${
                    agent.tasa_conversion >= 50
                      ? 'text-green-600'
                      : agent.tasa_conversion >= 25
                      ? 'text-orange-500'
                      : 'text-red-500'
                  }`}
                >
                  {agent.tasa_conversion}%
                </span>
              </td>
              <td className="px-5 py-3 text-right text-gray-500">{agent.sin_gestionar}</td>
              <td className="px-5 py-3 text-right text-gray-500">{agent.seguimientos_pendientes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

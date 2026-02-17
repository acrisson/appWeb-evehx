import React, { useState, useMemo } from 'react';
import {useEffect} from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  SquareChartGantt,
  PieChart as PieIcon 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Inventory } from './types';
import { formatCurrency, generateId } from './utils/format';
import { RecordForm } from './components/RecordForm';
import { InventoryTable } from './components/InventoryTable';
import { StatsCard } from './components/StatsCard';
import { 
  getRecords, 
  createRecord, 
  updateRecord, 
  deleteRecord } from './services/controller';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
// carregar o itens que estão armazenador no  banco de dados -->
const App: React.FC = () => {
  const [records, setRecords] = useState<Inventory[]>([]); 
  const [editingRecord, setEditingRecord] = useState<Inventory | null>(null);
  const [filterMes, setFilterMes] = React.useState<string>('');
  const [filterAno, setFilterAno] = React.useState<string>('');
  const loadRecords = async () => {
    const data = await getRecords();
    setRecords(data);
  };
  useEffect(() => {
    loadRecords();
  }, []);
    

  // Adicionar manipulador de registros
  const handleAddRecord = async (newRecord: Omit<Inventory, 'id' | 'timestamp'>) => {
    await createRecord(newRecord);
    loadRecords();
  };

  // Atualizar manipulador de registros
  const handleUpdateRecord = async (updatedRecord: Inventory) => {
    await updateRecord(updatedRecord.id, updatedRecord);
    setEditingRecord(null);
    loadRecords();
  };

  // Iniciar manipulador de edição
  const handleEditClick = (record: Inventory) => {
    setEditingRecord(record);
  };

  // Cancelamento de Edição
  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  // Delete Edição
  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id);
    loadRecords();
  };

  // Export CSV 
  const handleExportCSV = () => {
    const target = records.filter(r => {
      if (filterMes && Number(filterMes) !== r.mes) return false;
      if (filterAno && Number(filterAno) !== r.ano) return false;
      return true;
    });

    if (target.length === 0) {
      alert("Não há registros para exportar.");
      return;
    }

    const headers = "ID,Produto ID,Nome,Setor,Quantidade,Valor Unitário,Total\n";
    const csvContent = target.map(item => 
      `${item.id},${item.productid},${item.nome},${item.setor},${item.quantidade},${item.valorUnit},${item.total}`
    ).join("\n");

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_acessorios.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF 
  const handleExportPDF = () => {
    const target = records.filter(r => {
      if (filterMes && Number(filterMes) !== r.mes) return false;
      if (filterAno && Number(filterAno) !== r.ano) return false;
      return true;
    });

    if (target.length === 0) {
      alert("Não há registros para exportar.");
      return;
    }

    const doc = new jsPDF();
    
    // Cabeçalho do PDF
    doc.setFontSize(18);
    doc.text("Relatório de Acessórios", 14, 22);
    doc.setFontSize(11);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    // Resumo no topo do PDF
    const totalValue = target.reduce((acc, curr) => acc + curr.total, 0);
    const totalItems = target.reduce((acc, curr) => acc + curr.quantidade, 0);
    doc.text(`Total de Itens: ${totalItems} | Valor Total: ${formatCurrency(totalValue)}`, 14, 38);

    // Tabela de dados
    const tableColumn = ["ID", "Produto", "Setor", "Qtd", "Unitário", "Total"];
    const tableRows = target.map(record => [
      record.productid,
      record.nome,
      record.setor,
      record.quantidade,
      formatCurrency(record.valorUnit),
      formatCurrency(record.total)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("relatorio_acessorios.pdf");
  };

  // Filtered records according to selected month/year
  const filteredRecords = React.useMemo(() => {
    return records.filter(r => {
      if (filterMes && Number(filterMes) !== r.mes) return false;
      if (filterAno && Number(filterAno) !== r.ano) return false;
      return true;
    });
  }, [records, filterMes, filterAno]);

  // Cálculo de estatísticas e dados para gráficos
  const stats = useMemo(() => {
    const totalValue = records.reduce((acc, curr) => acc + Number(curr.total), 0);
    const totalItems = records.reduce((acc, curr) => acc + curr.quantidade, 0);
    const totalRecords = records.length;
    
    // Agrupar por setor para gráficos
    const sectorMap = records.reduce((acc, curr) => {
      acc[curr.setor] = (acc[curr.setor] || 0) + curr.total;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));

    return { totalValue, totalItems, totalRecords, chartData };
  }, [records]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ height: '100vh', overflowY: 'auto' }}>
      
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Controle de Acessórios TI</span>
            </div>
            <div className="text-sm text-slate-400">
               Controle de Estoque & Custos
            </div>
          </div>
        </div>
      </nav>

      {/* pagina principal  main */}
      {/* Outra opçao de tela // <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">*/}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Valor Total" 
            value={formatCurrency(stats.totalValue)} 
            icon={DollarSign} 
            colorClass="bg-emerald-500 text-emerald-600" 
          />
          <StatsCard 
            title="Itens Totais" 
            value={stats.totalItems.toString()} 
            icon={SquareChartGantt} 
            colorClass="bg-blue-500 text-blue-600" 
          />
          <StatsCard 
            title="Registros" 
            value={stats.totalRecords.toString()} 
            icon={TrendingUp} 
            colorClass="bg-violet-500 text-violet-600" 
          />
        </div>

        {/* Área de Formulários e Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da esquerda: Formulário de entrada */}
          <div className="lg:col-span-1">
            <RecordForm 
              onAdd={handleAddRecord} 
              onUpdate={handleUpdateRecord}
              editingRecord={editingRecord}
              onCancelEdit={handleCancelEdit}
            />
            
            {/*Minigráfico, se houver dados */}
            {stats.chartData.length > 0 && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hidden lg:block">
                    <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                        <PieIcon className="w-4 h-4" /> Distribuição por Setor (R$)
                    </h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            )}
          </div>

          {/* Coluna da direita: Tabela e gráfico de barras */}
          <div className="lg:col-span-2 flex flex-col gap-8">
             {/* Tabela de dados */}
             <div className="flex-1 min-h-[400px]">
              <div className="mb-4 bg-white p-4 rounded-md">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm text-slate-600">Mês</label>
                    <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className="rounded border p-2">
                      <option value="">Todos</option>
                      {Array.from({length:12}).map((_,i) => <option key={i} value={i+1}>{i+1}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600">Ano</label>
                    <select value={filterAno} onChange={(e) => setFilterAno(e.target.value)} className="rounded border p-2">
                      <option value="">Todos</option>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <button className="ml-auto text-sm text-slate-600 underline" onClick={() => { setFilterMes(''); setFilterAno(''); }}>Limpar</button>
                </div>
              </div>

              <InventoryTable 
                records={filteredRecords} 
                onDelete={handleDeleteRecord}
                onEdit={handleEditClick}
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
              />
             </div>

             {/* Bottom Chart */}
             {stats.chartData.length > 0 && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Gastos por Setor</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(val) => `R$${val}`} />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip 
                                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                                    cursor={{fill: '#f1f5f9'}}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
import React, { useState, useMemo } from 'react';
import {useEffect} from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
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

import { Inventory, ProdutoItem } from './types';
import { formatCurrency} from './utils/format';
import { RecordForm } from './components/RecordForm';
import { InventoryTable } from './components/InventoryTable';
import { ProductForm } from './components/ProductForm';
import { ProductTable } from './components/ProductTable';
import { StatsCard } from './components/StatsCard';
import { 
  getRecords, 
  createRecord, 
  updateRecord, 
  deleteRecord,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './services/controller';
import { INITIAL_PRODUCT_LIST } from './constants';
import logo from './src/assets/logo.png';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
// carregar o itens que estão armazenador no  banco de dados -->
const App: React.FC = () => {
  // view mode: 'records' or 'stock'
  const [view, setView] = useState<'records' | 'stock'>('records');

  // records state
  const [records, setRecords] = useState<Inventory[]>([]); 
  const [editingRecord, setEditingRecord] = useState<Inventory | null>(null);
  const [filterMes, setFilterMes] = React.useState<string>('');
  const [filterAno, setFilterAno] = React.useState<string>('');

  // products state loaded from API
  const [products, setProducts] = useState<ProdutoItem[]>(INITIAL_PRODUCT_LIST);
  const [editingProduct, setEditingProduct] = useState<ProdutoItem | null>(null);

  // recalcular estoque disponível conforme registros criados/atualizados
  const productsWithStock: ProdutoItem[] = useMemo(() => {
    return products.map((p) => {
      const usedQty = records
        .filter(r => r.productId === p.id)
        .reduce((a, c) => a + c.quantidade, 0);
      return { ...p, estoque: Math.max(0, p.estoque - usedQty) };
    });
  }, [records, products]);
 // const [availableMonths, setAvailableMonths] = useState<number[]>([]);
 // const [availableYears, setAvailableYears] = useState<number[]>([]);
  const normalizeRecord = (r: any): Inventory => ({
    ...r,
    productId: r.productId ?? r.productid,
    valorUnit: r.valorUnit ?? r.valorunit,
    total: r.total ?? r.total,
    estoque: r.estoque ?? r.estoque,
    setor: r.setor ?? r.setor,
    quantidade: r.quantidade ?? r.quantidade,
    mes: r.mes ?? r.mes,
    ano: r.ano ?? r.ano,
    timestamp: r.timestamp ?? r.timestamp,
  });

  const loadRecords = async () => {
    const data = await getRecords();
    setRecords(Array.isArray(data) ? data.map(normalizeRecord) : []);
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('failed to load products', e);
    }
  };

  

  useEffect(() => {
    loadRecords();
    loadProducts();
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

  // -------- product handlers ----------
  const handleAddProduct = async (newProd: Omit<ProdutoItem, 'id'>) => {
    await createProduct(newProd);
    loadProducts();
  };

  // update uses the current editingProduct id; form sends only the fields
  const handleUpdateProduct = async (data: Omit<ProdutoItem, 'id'>) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, {
      nome: data.nome,
      valor: data.valor,
      estoque: data.estoque,
    });
    setEditingProduct(null);
    loadProducts();
  };

  const handleEditProductClick = (prod: ProdutoItem) => {
    setEditingProduct(prod);
  };

  const handleCancelProductEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: number) => {
    console.log("deletando produto com id", id);
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err: any) {
      console.error("falha ao deletar produto", err);
      alert(
        "Não foi possível excluir o produto. Talvez ele esteja em uso ou ocorreu um erro no servidor."
      );
    }
  };

  // Export CSV of records
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
      `${item.id},${item.productId},${item.nome},${item.setor},${item.quantidade},${item.valorUnit},${item.total}`
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

  // Export PDF of records
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
    doc.text(`Mês Referente: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    // Resumo no topo do PDF
    const totalValue = target.reduce((acc, curr) => acc + (isNaN(Number(curr.total)) ? 0 : Number(curr.total)), 0);
    const totalItems = target.reduce((acc, curr) => acc + curr.quantidade, 0);
    doc.text(`Total de Itens: ${totalItems} | Valor Total: ${formatCurrency(totalValue)}`, 14, 38);
         
    // Tabela de dados
    const tableColumn = ["ID", "Produto", "Setor", "Qtd", "Unitário", "Total"];
    const tableRows = target.map(record => [
      record.productId,
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

  // export helpers for products
  const handleExportProductsCSV = () => {
    if (products.length === 0) {
      alert('Não há produtos para exportar.');
      return;
    }
    const headers = 'ID,Nome,Valor,Estoque\n';
    const csvContent = products.map(p => `${p.id},${p.nome},${p.valor},${p.estoque}`).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'estoque.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProductsPDF = () => {
    if (products.length === 0) {
      alert('Não há produtos para exportar.');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Estoque de Produtos', 14, 22);
    const tableColumn = ['ID', 'Nome', 'Valor', 'Estoque'];
    const tableRows = products.map(p => [p.id, p.nome, formatCurrency(p.valor), p.estoque]);
    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save('estoque.pdf');
  };

  // Extrair meses e anos únicos dos registros
  const filteredRecords = useMemo(() => {
  return records.filter(r => {
    const date = new Date(r.timestamp);
    const mes = date.getMonth() + 1; // Janeiro = 0
    const ano = date.getFullYear();

    if (filterMes && Number(filterMes) !== mes) return false;
    if (filterAno && Number(filterAno) !== ano) return false;

    return true;
  });
}, [records, filterMes, filterAno]);

const { availableMonths, availableYears } = useMemo(() => {
  const monthsSet = new Set<number>();
  const yearsSet = new Set<number>();

  records.forEach((r) => {
    const date = new Date(r.timestamp);
    monthsSet.add(date.getMonth() + 1); // Janeiro = 0
    yearsSet.add(date.getFullYear());
  });

  return {
    availableMonths: Array.from(monthsSet).sort((a, b) => a - b),
    availableYears: Array.from(yearsSet).sort((a, b) => b - a),
  };
}, [records]);

  // Cálculo de estatísticas e dados para gráficos
  const stats = useMemo(() => {
  const totalValue = filteredRecords.reduce(
    (acc, curr) => acc + Number(curr.total),
    0
  );

  const totalItems = filteredRecords.reduce(
    (acc, curr) => acc + curr.quantidade,
    0
  );

  const totalRecords = filteredRecords.length;

  const sectorMap = filteredRecords.reduce((acc, curr) => {
    const totalNumber = Number(curr.total);
    acc[curr.setor] = (acc[curr.setor] || 0) + totalNumber;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(sectorMap).map(([name, value]) => ({
    name,
    value,
  }));

  return { totalValue, totalItems, totalRecords, chartData };
}, [filteredRecords]);
    
  // Estatísticas para a página de estoque
  const stockStats = useMemo(() => {
    const totalStock = productsWithStock.reduce((acc, p) => acc + p.estoque, 0);
    const totalOutput = products.reduce((acc, p) => {
      const current = productsWithStock.find(pws => pws.id === p.id)?.estoque || 0;
      return acc + (p.estoque - current);
    }, 0);
    return { totalStock, totalOutput };
  }, [products, productsWithStock]);
        
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
            <div className="text-sm text-slate-400">Controle de Estoque & Custos</div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* switch between "Registros" and "Estoque" views */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('records')}
            className={`px-4 py-2 rounded ${view === 'records' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}
          >Registros</button>
          <button
            onClick={() => setView('stock')}
            className={`px-4 py-2 rounded ${view === 'stock' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}
          >Estoque</button>
        </div>

        {view === 'records' ? ( <>
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
            <div className="lg:col-span-1">
              <RecordForm 
                productList={productsWithStock}
                onAdd={handleAddRecord} 
                onUpdate={handleUpdateRecord}
                editingRecord={editingRecord}
                onCancelEdit={handleCancelEdit}
              />



              <div className="mt-20 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hidden lg:block"> 
                <img src={logo} alt="Logo" width="100%" /> </div>
             {/* Gráfico de pizza para distribuição por setor */} 
              {/*stats.chartData?.length > 0 && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hidden lg:block">
                    <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                        <PieIcon className="w-4 h-4" /> Distribuição por Setor (R$)
                    </h3>
                    <div className="h-64 flex-1">
                         <ResponsiveContainer width="100%" height={300}>
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
                                    {stats.chartData.map((entry:{ name: string; value: number }, index: number) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            ) */} 
          </div>
         


          {/* Coluna da direita: Tabela e gráfico de barras */}
          <div className="lg:col-span-2 flex flex-col gap-8">
             {/* Tabela para seleção de registros de Mes e ano */}
             <div className="flex-1 min-h-[400px]">
              <div className="mb-4 bg-white p-4 rounded-md">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm text-slate-600">Mês</label>
                    <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className="rounded border p-2">
                      <option value="">Todos</option>
                        {availableMonths.map((mes) =>(
                        <option key={mes} value={mes}>
                          {mes.toString().padStart(2, '0')}
                          </option>))}
                    
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600">Ano</label>
                    <select value={filterAno} onChange={(e) => setFilterAno(e.target.value)} className="rounded border p-2">
                      <option value="">Todos</option>
                            {availableYears.map((ano) => (
                            <option key={ano} value={ano}>
                                {ano}
                               </option>))}
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
                                <YAxis dataKey="name" type="category" width={120} />
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
        </> ) : ( <>
        {/* stock view */}
          {/* Cards de Estatísticas do Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatsCard 
              title="Quantidade Total em Estoque" 
              value={stockStats.totalStock.toString()} 
              icon={SquareChartGantt} 
              colorClass="bg-green-500 text-green-600" 
            />
            <StatsCard 
              title="Quantidade Total de Saída" 
              value={stockStats.totalOutput.toString()} 
              icon={TrendingUp} 
              colorClass="bg-red-500 text-red-600" 
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ProductForm
                editingProduct={editingProduct}
                onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
                onCancelEdit={handleCancelProductEdit}
              />
            </div>
            <div className="lg:col-span-2">
              <ProductTable
                products={productsWithStock}
                originalProducts={products}
                onDelete={handleDeleteProduct}
                onEdit={handleEditProductClick}
                onExportCSV={handleExportProductsCSV}
                onExportPDF={handleExportProductsPDF}
              />
            </div>
          </div>
        </> )}
      </main>
    </div>
  );
};

export default App;
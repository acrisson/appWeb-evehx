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
import { INITIAL_PRODUCT_LIST, SECTORS } from './constants';
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
  const [filterSetor, setFilterSetor] = React.useState<string>('');

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
  const normalizeRecord = (r: any): Inventory => {
    const rawTimestamp = r.timestamp ?? r.createdAt ?? r.created_at ?? r.date ?? 0;
    const timestampValue = typeof rawTimestamp === 'number'
      ? rawTimestamp
      : rawTimestamp
        ? new Date(rawTimestamp).getTime()
        : 0;
    const parsedTimestamp = Number.isFinite(timestampValue) ? timestampValue : 0;

    const rawMes = r.mes ?? r.month ?? r.monthNumber;
    const rawAno = r.ano ?? r.year;
    const mesValue = Number(rawMes);
    const anoValue = Number(rawAno);

    let parsedMes = Number.isInteger(mesValue) && mesValue >= 1 && mesValue <= 12 ? mesValue : NaN;
    let parsedAno = Number.isInteger(anoValue) && anoValue > 0 ? anoValue : NaN;

    if (!Number.isInteger(parsedMes) || !Number.isInteger(parsedAno)) {
      const date = new Date(parsedTimestamp);
      const dateMes = date.getMonth() + 1;
      const dateAno = date.getFullYear();
      if (!Number.isInteger(parsedMes) && dateMes >= 1 && dateMes <= 12) {
        parsedMes = dateMes;
      }
      if (!Number.isInteger(parsedAno) && dateAno > 0) {
        parsedAno = dateAno;
      }
    }

    return {
      ...r,
      productId: r.productId ?? r.productid,
      valorUnit: r.valorUnit ?? r.valorunit,
      total: r.total ?? r.total,
      estoque: r.estoque ?? r.estoque,
      setor: r.setor ?? r.setor,
      quantidade: r.quantidade ?? r.quantidade,
      mes: parsedMes,
      ano: parsedAno,
      timestamp: parsedTimestamp,
    } as Inventory;
  };

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

  // update usa o ID do produto de edição atual; formulário envia apenas os campos
  const handleUpdateProduct = async (data: Omit<ProdutoItem, 'id'>) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, {
      nome: data.nome,
      valor: data.valor,
      estoque: Number(editingProduct.estoque) + Number(data.estoque), // somar estoque existente com o novo valor
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
      const date = new Date(r.timestamp);
      const mes = date.getMonth() + 1;
      const ano = date.getFullYear();

      if (filterMes && Number(filterMes) !== mes) return false;
      if (filterAno && Number(filterAno) !== ano) return false;
      if (filterSetor && filterSetor !== r.setor) return false;
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
  const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("pt-BR");
  };
  const handleExportPDF = () => {
  const target = records.filter((r) => {
    const date = new Date(r.timestamp);
    const mes = date.getMonth() + 1;
    const ano = date.getFullYear();

    if (filterMes && Number(filterMes) !== mes) return false;
    if (filterAno && Number(filterAno) !== ano) return false;
    if (filterSetor && filterSetor !== r.setor) return false;
    return true;
  });

  if (target.length === 0) {
    alert("Não há registros para exportar.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ========= DADOS RESUMO =========
  const totalValue = target.reduce(
    (acc, curr) => acc + (isNaN(Number(curr.total)) ? 0 : Number(curr.total)),
    0
  );

  const totalItems = target.reduce(
    (acc, curr) => acc + (isNaN(Number(curr.quantidade)) ? 0 : Number(curr.quantidade)),
    0
  );

  const periodoTexto = `${
    filterMes ? String(filterMes).padStart(2, "0") : "Todos"
  }/${filterAno || "Todos"}`;

  const setorTexto = filterSetor || "Todos";

  const dataGeracao = new Date().toLocaleString("pt-BR");

  // ========= CORES =========
  const primaryColor: [number, number, number] = [30, 58, 138];
const secondaryColor: [number, number, number] = [59, 130, 246];
const lightBg: [number, number, number] = [243, 244, 246];
const textDark: [number, number, number] = [31, 41, 55];
const successColor: [number, number, number] = [22, 163, 74];

  // ========= CABEÇALHO =========
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.addImage(logo, "PNG", pageWidth - 60, 10, 40, 20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório de Acessórios", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${dataGeracao}`, 14, 23);

  // ========= INFORMAÇÕES DOS FILTROS =========
  let currentY = 38;

  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Evehx Engenharia", 14, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Período: ${periodoTexto}`, 14, currentY);
  doc.text(`Setor: ${setorTexto}`, 80, currentY);

  // ========= CAIXAS DE RESUMO =========
  currentY += 10;

  // Caixa total de itens
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, currentY, 55, 18, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("Total de Itens", 18, currentY + 7);
  doc.setFontSize(13);
  doc.setTextColor(...secondaryColor);
  doc.text(String(totalItems), 18, currentY + 14);

  // Caixa valor total
  doc.setFillColor(...lightBg);
  doc.roundedRect(75, currentY, 75, 18, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("Valor Total", 79, currentY + 7);
  doc.setFontSize(13);
  doc.setTextColor(...successColor);
  doc.text(formatCurrency(totalValue), 79, currentY + 14);

  currentY += 28;

  // ========= TABELA =========
  const tableColumn = [
    "ID",
    "Produto",
    "Setor",
    "Qtd",
    "Data Registro",
    "Valor Unit.",
    "Valor Total",
  ];

  const tableRows = target.map((record) => [
    String(record.productId ?? ""),
    String(record.nome ?? ""),
    String(record.setor ?? ""),
    String(record.quantidade ?? 0),
    formatDate(record.timestamp),
    formatCurrency(record.valorUnit ?? 0),
    formatCurrency(record.total ?? 0),
  ]);

  autoTable(doc, {
  startY: currentY,
  head: [tableColumn],
  body: tableRows,
  theme: "striped",
  styles: {
    font: "helvetica",
    fontSize: 9,
    cellPadding: 3,
    textColor: textDark,
    valign: "middle",
    overflow: "linebreak",
  },
  headStyles: {
    fillColor: primaryColor,
    textColor: [255, 255, 255],
    fontStyle: "bold",
    fontSize: 10,
    halign: "center",
    valign: "middle",
  },
  columnStyles: {
    0: { halign: "center", cellWidth: 10 }, // ID
    1: { cellWidth: 65 },                   // Produto
    2: { halign: "center", cellWidth: 38 }, // Setor
    3: { halign: "center", cellWidth: 15 }, // Qtd
    4: { halign: "center", cellWidth: 25 }, // Data
    5: { halign: "right", cellWidth: 25},  // Valor Unit.
    6: { halign: "right", cellWidth: 25 },  // Valor Total
  },
  margin: { left: 5, right: 5 },
  didDrawPage: () => {
    const pageNumber = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Página ${pageNumber}`, pageWidth - 30, pageHeight - 10);
    doc.text("Relatório gerado automaticamente pelo sistema", 10, pageHeight - 10);
  },
});
  // ========= NOME DO ARQUIVO =========
  const dataArquivo = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio_acessorios_${dataArquivo}.pdf`);
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
    const mes = date.getMonth() + 1;
    const ano = date.getFullYear();

    if (filterMes && Number(filterMes) !== mes) return false;
    if (filterAno && Number(filterAno) !== ano) return false;
    if (filterSetor && filterSetor !== r.setor) return false;

    return true;
  });
}, [records, filterMes, filterAno, filterSetor]);

const { availableMonths, availableYears } = useMemo(() => {
  const monthsSet = new Set<number>();
  const yearsSet = new Set<number>();

  records.forEach((r) => {
    const date = new Date(r.timestamp);
    const mes = date.getMonth() + 1;
    const ano = date.getFullYear();
    if (mes >= 1 && mes <= 12) {
      monthsSet.add(mes);
    }
    if (ano > 0) {
      yearsSet.add(ano);
    }
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
                  <div>
                    <label className="block text-sm text-slate-600">Setor</label>
                    <select value={filterSetor} onChange={(e) => setFilterSetor(e.target.value)} className="rounded border p-2">
                      <option value="">Todos</option>
                      {SECTORS.map((setor) => (
                        <option key={setor} value={setor}>{setor}</option>
                      ))}
                    </select>
                  </div>
                  <button className="ml-auto text-sm text-slate-600 underline" onClick={() => { setFilterMes(''); setFilterAno(''); setFilterSetor(''); }}>Limpar</button>
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
                                    formatter={(value: any) => [formatCurrency(value), "Total"]}
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
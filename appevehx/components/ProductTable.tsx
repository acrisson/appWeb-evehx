import React from 'react';
import { Trash2, FileText, Download, Pencil, PackageOpen } from 'lucide-react';
import { ProdutoItem } from '../types';
import { formatCurrency } from '../utils/format';

interface ProductTableProps {
  products: ProdutoItem[];
  originalProducts: ProdutoItem[];
  onDelete: (id: number) => void;
  onEdit: (product: ProdutoItem) => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  originalProducts,
  onDelete,
  onEdit,
  onExportPDF,
  onExportCSV,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <PackageOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-medium text-slate-700">Nenhum produto no estoque</h3>
        <p className="text-slate-500 mt-2">Utilize o formulário ao lado para adicionar produtos.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] max-w-[100%] bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Estoque Atual ({products.length})</h2>
        <div className="flex space-x-2">
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-green-400 hover:bg-green-200 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4" /> EXCEL
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          )}
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-3 font-semibold">ID</th>
              <th className="px-6 py-3 font-semibold">Nome</th>
              <th className="px-6 py-3 font-semibold text-right">Valor</th>
              <th className="px-6 py-3 font-semibold text-right">Estoque</th>
              <th className="px-6 py-3 font-semibold text-center">Saida</th>
              <th className="px-6 py-3 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((prod) => {
              const original = originalProducts.find(p => p.id === prod.id);
              const saidaValue = original ? original.estoque - prod.estoque : 0;
              const stockValue = prod.estoque;
              const stockClass = stockValue < 0? 'text-red-600' :   'text-green-600';
              const saidaClass = saidaValue > 0 ? 'text-red-600' : 'text-green-600'
              return (
              <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-800 font-mono">{prod.id}</td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium">{prod.nome}</td>
                <td className="px-6 py-4 text-sm text-slate-800 text-right">{formatCurrency(prod.valor)}</td>
                <td className={`px-6 py-4 text-lg text-slate-800 text-right ${stockClass}`}>{stockValue}</td>
                <td className={`px-6 py-4 text-lg text-slate-800 text-right ${saidaClass}`}>{saidaValue}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(prod)}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(prod.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

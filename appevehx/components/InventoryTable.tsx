import React from 'react';
import { Trash2, FileText, Download, PackageOpen, Pencil } from 'lucide-react';
import { Inventory } from '../types';
import { formatCurrency } from '../utils/format';

interface InventoryTableProps {
  records: Inventory[];
  onDelete: (id: string) => void;
  onEdit: (record: Inventory) => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  records, 
  onDelete, 
  onEdit,
  onExportPDF, 
  onExportCSV 
}) => {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <PackageOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-medium text-slate-700">Nenhum registro encontrado</h3>
        <p className="text-slate-500 mt-2">Utilize o formulário ao lado para adicionar itens ao relatório.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] max-w-[100%] bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Registros Atuais ({records.length})</h2>
        <div className="flex space-x-2">
            <button 
                onClick={onExportCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-green-400 hover:bg-green-200 rounded-md transition-colors"
            >
                <FileText className="w-4 h-4" /> EXCEL
            </button>
            <button 
                onClick={onExportPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
                <Download className="w-4 h-4" /> PDF
            </button>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-3 font-semibold">ID</th>
              <th className="px-6 py-3 font-semibold">Produto</th>
              <th className="px-6 py-3 font-semibold">Setor</th>
              <th className="px-6 py-3 font-semibold text-right">Qtd</th>
              <th className="px-6 py-3 font-semibold text-right">Unitário</th>
              <th className="px-6 py-3 font-semibold text-right">Total</th>
              <th className="px-6 py-3 font-semibold text-right">Estoque</th>
              <th className="px-6 py-3 font-semibold text-center">Ações</th>
              
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{record.productid}</td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium">{record.nome}</td>
             {/*<td className="px-6 py-4 text-sm text-slate-600">{record.mes}</td>*/}
                <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {record.setor}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right">{record.quantidade}</td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatCurrency(record.valorUnit)}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">{formatCurrency(record.total)}</td>
                <td className="px-6 py-4 text-sm text-slate-600 text-right">{record.estoque}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(record)}
                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(record.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Plus, Save, Edit2, X } from 'lucide-react';
import { PRODUCT_LIST, SECTORS } from '../constants';
import { formatCurrency } from '../utils/format';
import { Inventory } from '../types';

interface RecordFormProps {
  onAdd: (record: Omit<Inventory, 'id' | 'timestamp'>) => void;
  onUpdate: (record: Inventory) => void;
  editingRecord: Inventory | null;
  onCancelEdit: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({ 
  onAdd, 
  onUpdate, 
  editingRecord, 
  onCancelEdit 
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [sector, setSector] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [mes, setMes] = useState<string>(new Date().getMonth() + 1 + "");
  const [ano, setAno] = useState<string>(new Date().getFullYear() + "");

  // Preencher formulário ao editar alterações de registro
  useEffect(() => {
    if (editingRecord) {
      setSelectedProductId(editingRecord.productid.toString());
      setSector(editingRecord.setor);
      setQuantity(editingRecord.quantidade.toString());
      //setMes(editingRecord.mes.toString());
     // setAno(editingRecord.ano.toString());
    } else {
      resetForm();
    }
  }, [editingRecord]);

  const resetForm = () => {
    setSelectedProductId("");
    setSector("");
    setQuantity("");
    setMes(new Date().getMonth() + 1 + "");
    setAno(new Date().getFullYear() + "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !sector || !quantity) return;

    const product = PRODUCT_LIST.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    const qty = Number(quantity);
    const total = product.valor * qty;
    const estoque = product.estoque - qty;
    if (editingRecord) {
      // Atualizar registro existente
      onUpdate({
        ...editingRecord,
        productId: product.id,
        nome: product.nome,
        setor: sector,
        quantidade: qty,
        valorUnit: product.valor,
        total: total,
        estoque: estoque
        , mes: Number(mes), ano: Number(ano)
      });
    } else {
      // Adicionar novo registro
      onAdd({
        productId: product.id,
        nome: product.nome,
        setor: sector,
        quantidade: qty,
        valorUnit: product.valor,
        total: total,
        estoque: estoque
        , mes: Number(mes), ano: Number(ano)
        
      });
    }

    if (!editingRecord) resetForm();
  };

  const selectedProduct = PRODUCT_LIST.find(p => p.id === Number(selectedProductId));
  const isEditing = !!editingRecord;

  return (
    <div className={`bg-white rounded-xl shadow-md border ${isEditing ? 'border-amber-200 ring-1 ring-amber-200' : 'border-slate-100'} overflow-hidden transition-all duration-300 max-h-[520px] flex flex-col`}>
      <div className={`${isEditing ? 'bg-amber-600' : 'bg-slate-800'} px-6 py-4 flex items-center justify-between transition-colors duration-300 flex-shrink-0`}>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {isEditing ? (
            <><Edit2 className="w-5 h-5" /> Editar Registro</>
          ) : (
            <><Plus className="w-5 h-5" /> Novo Registro</>
          )}
        </h2>
        {isEditing && (
          <button 
            onClick={onCancelEdit}
            className="text-white/80 hover:text-white transition-colors"
            title="Cancelar Edição"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-auto flex-1">
        
        {/*Seleção de Produtos*/}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          >
            <option value="">Selecione um produto...</option>
            {PRODUCT_LIST.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.id} - {prod.nome} : {prod.estoque} Estoque
              </option>
            ))}
          </select>
        </div>

        {/* Exibição dinâmica de preços */}
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Selecione...</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
           
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
                required
              />
           </div>
        </div>

        {/* Pré-visualização do cálculo em tempo real */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-500">Valor Unitário:</span>
                <span className="font-semibold text-slate-700">
                    {selectedProduct ? formatCurrency(selectedProduct.valor) : 'R$ 0,00'}
                </span>
            </div>
            <div className={`flex justify-between items-center text-lg font-bold ${isEditing ? 'text-amber-600' : 'text-blue-600'} border-t border-slate-200 mt-2 pt-2`}>
                <span>Total Estimado:</span>
                <span>
                    {selectedProduct && quantity 
                        ? formatCurrency(selectedProduct.valor * Number(quantity)) 
                        : 'R$ 0,00'}
                </span>
            </div>
        </div>

        {/* Seleção de Mês / Ano */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mês de Referência</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ano de Referência</label>
            <select
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          {isEditing && (
            <button 
              type="button" 
              onClick={onCancelEdit}
              className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
              type="submit" 
              className={`flex-1 py-3 px-4 ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded-lg shadow-md transition-colors flex items-center justify-center gap-2`}
          >
              <Save className="w-6 h-6" /> {isEditing ? 'Salvar Alterações' : 'Salvar Registro'}
          </button>
        </div>

      </form>
    </div>
  );
};
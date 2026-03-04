import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ProdutoItem } from '../types';

interface ProductFormProps {
  editingProduct: ProdutoItem | null;
  onSave: (prod: Omit<ProdutoItem, 'id'>) => void;
  onCancelEdit: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  editingProduct,
  onSave,
  onCancelEdit,
}) => {
  const [nome, setNome] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [estoque, setEstoque] = useState<string>('');

  useEffect(() => {
    if (editingProduct) {
      setNome(editingProduct.nome);
      setValor(editingProduct.valor.toString());
      setEstoque(editingProduct.estoque.toString());
    } else {
      resetForm();
    }
  }, [editingProduct]);

  const resetForm = () => {
    setNome('');
    setValor('');
    setEstoque('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor || !estoque) return;

    const prod = {
      nome,
      valor: Number(valor),
      estoque: Number(estoque),
    };

    onSave(prod);
    if (!editingProduct) resetForm();
  };

  const isEditing = !!editingProduct;

  return (
    <div className={`bg-white rounded-xl shadow-md border ${
      isEditing ? 'border-amber-200' : 'border-slate-100'
    } overflow-hidden transition-all duration-300 max-h-[520px] flex flex-col`}> 
      <div className={`${
        isEditing ? 'bg-amber-600' : 'bg-slate-800'
      } px-6 py-4 flex items-center justify-between`}>
        <h2 className="text-lg font-semibold text-white">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h2>
        {isEditing && (
          <button onClick={onCancelEdit} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estoque</label>
          <input
            type="number"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          {isEditing && (
            <button type="button" onClick={onCancelEdit} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 rounded-lg">
              Cancelar
            </button>
          )}
          <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            {isEditing ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  );
};

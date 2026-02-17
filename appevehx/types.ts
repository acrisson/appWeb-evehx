export interface ProdutoItem {
  id: number;
  nome: string;
  valor: number;
  estoque: number;
}

export interface Inventory {
  id: string;
  productId: number;
  nome: string;
  setor: string;
  quantidade: number;
  valorUnit: number;
  total: number;
  estoque: number;
  mes: number;
  ano: number;
  timestamp: number;
}

export interface Produtos {
  [key: number]: {
    nome: string;
    valor: number;
    estoque: number;
  };
}
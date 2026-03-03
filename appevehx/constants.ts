import { Produtos} from './types';

// Dados  para estrutura 
export const ITEMS: Produtos = {
  101: { nome: "TECLADO-Logitech K120", valor: 72.80 , estoque: 3},
  102: { nome: "MOUSE-Logitech M170", valor: 69.90, estoque: 2 },
  103: { nome: "SUPORTE NOTEBOOK - Maxcril", valor: 25.90, estoque: 5 },
  104: { nome: "SUPORTE NOTEBOOK - Reliza", valor: 16.90, estoque: 4 },
  105: { nome: "MOUSE - Logitech M90", valor: 38.00, estoque: 3 },
  106: { nome: "MOUSE - Logitech M190", valor: 69.90, estoque: 4 },
  107: { nome: "TECLADO - Logitech K120- USANDO", valor: 0.00, estoque: 6 }
};

// converter o ITEMS em array para Objeto (estado inicial dos produtos):
export const INITIAL_PRODUCT_LIST = Object.entries(ITEMS).map(([id, data]) => ({
  id: Number(id),
  ...data
}));
// alias mantido para compatibilidade, mas o fluxo agora utiliza o valor inicial
export const PRODUCT_LIST = INITIAL_PRODUCT_LIST; 

export const SECTORS = [
  "JURIDICO",
  "FINANCEIRO",
  "TI",
  "RH",
  "COMPRAS",
  "COMERCIAL",
  "QUALIDADE",
  "ENGENHARIA",
  "MANUTENÇÃO",
  "DIRETORIA",
  "ONCRETS",
  "PRODUÇÃO",
  "PCP",
  "ESTUDOS",
  "ESCORAMENTO",
];
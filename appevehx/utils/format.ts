export function formatCurrency(valor?: number | null) {
  if (valor == null) return "R$ 0,00";

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
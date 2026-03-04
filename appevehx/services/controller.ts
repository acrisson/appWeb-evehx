const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || "https://server-evehx2.onrender.com"; // use env variable or default to local dev server

function normalizeResponse(record: any) {
 
  return {
    ...record,
    productId: record.productId ?? record.productid,
    valorUnit: record.valorUnit ?? record.valorunit,
  };
}

export async function getRecords(filters?: { mes?: number; ano?: number }) {
  let url = `${API_URL}/usuarios`;
  if (filters) {
    const params = new URLSearchParams();
    if (typeof filters.mes === 'number') params.append('mes', filters.mes.toString());
    if (typeof filters.ano === 'number') params.append('ano', filters.ano.toString());
    if (Array.from(params).length > 0) {
      url += `?${params.toString()}`;
    }
  }

  const response = await fetch(url);
  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map(normalizeResponse);
  }
  return normalizeResponse(data);
}

function prepareRequest(data: any) {
  const r: any = { ...data };
  if (data.productId !== undefined) r.productid = data.productId;
  if (data.valorUnit !== undefined) r.valorunit = data.valorUnit;
  return r;
}

export async function createRecord(data: any) {
  const payload = prepareRequest(data);
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function updateRecord(id: string, data: any) {
  const payload = prepareRequest(data);
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function deleteRecord(id: string) {
  await fetch(`${API_URL}/usuarios/${id}`, {
    method: "DELETE",
  });
}

// product-related helpers --------------------------------------------------
export async function getProducts() {
  const res = await fetch(`${API_URL}/produtos`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  return res.json();
}

export async function createProduct(data: { nome: string; valor: number; estoque: number }) {
  const res = await fetch(`${API_URL}/produtos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API error ${res.status}: ${t}`);
  }
  return res.json();
}

export async function updateProduct(id: number | string, data: { nome?: string; valor?: number; estoque?: number }) {
  const res = await fetch(`${API_URL}/produtos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API error ${res.status}: ${t}`);
  }
  return res.json();
}

export async function deleteProduct(id: number | string) {
  const res = await fetch(`${API_URL}/produtos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`delete failed: ${res.status} ${t}`);
  }
}

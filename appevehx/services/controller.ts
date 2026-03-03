const API_URL = "https://server-evehx2.onrender.com";

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

const API_URL = "https://server-evehx2.onrender.com";

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
  return response.json();
}

export async function createRecord(data: any) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function updateRecord(id: string, data: any) {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function deleteRecord(id: string) {
  await fetch(`${API_URL}/usuarios/${id}`, {
    method: "DELETE",
  });
}

//export async function getMonthsAndYears() {
//  const response = await fetch(`${API_URL}/usuarios/meses-anos`);
 // return response.json();
//}
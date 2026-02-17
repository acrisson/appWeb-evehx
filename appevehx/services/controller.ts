const API_URL = "https://server-evehx2.onrender.com";

export async function getRecords() {
  const response = await fetch(`${API_URL}/usuarios`);
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
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function parseResponse(response) {
  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Unable to process your request."
    );
  }

  return result;
}

export async function submitBooking(data) {
  const response = await fetch(
    `${API_BASE_URL}/api/bookings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return parseResponse(response);
}

export async function submitEnquiry(data) {
  const response = await fetch(
    `${API_BASE_URL}/api/enquiries`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return parseResponse(response);
}
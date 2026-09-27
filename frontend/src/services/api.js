// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// async function parseResponse(response) {
//   let result = {};

//   try {
//     result = await response.json();
//   } catch {
//     result = {};
//   }

//   if (!response.ok) {
//     throw new Error(
//       result.message ||
//         "Unable to process your request."
//     );
//   }

//   return result;
// }

// export async function submitBooking(data) {
//   const response = await fetch(
//     `${API_BASE_URL}/api/bookings`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     }
//   );

//   return parseResponse(response);
// }

// export async function submitEnquiry(data) {
//   const response = await fetch(
//     `${API_BASE_URL}/api/enquiries`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     }
//   );

//   return parseResponse(response);
// }


import { supabase } from "../lib/supabaseClient";


/* =========================================================
   SUBMIT BOOKING
   ========================================================= */

export async function submitBooking(data) {
  const { type, name, mobile, itemName, price, } = data;

  const { error } = await supabase
    .from("bookings")
    .insert({
      booking_type: type,
      name: name.trim(),
      mobile: mobile.trim(),
      item_name: itemName,
      price: price || null,
    });

  if (error) {
    console.error("Supabase booking error:", error);

    throw new Error(
      "Unable to submit booking. Please try again."
    );
  }

  return {
    success: true,
  };
}


/* =========================================================
   SUBMIT ENQUIRY
   ========================================================= */

export async function submitEnquiry(data) {
  const { name, mobile, message, } = data;

  const { error } = await supabase
    .from("enquiries")
    .insert({
      name: name.trim(),
      mobile: mobile.trim(),
      message: message?.trim() || null,
    });

  if (error) {
    console.error("Supabase enquiry error:", error);

    throw new Error(
      "Unable to submit enquiry. Please try again."
    );
  }

  return {
    success: true,
  };
}
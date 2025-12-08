export async function POST(request) {
  const formData = await request.formData();
  const session_id = formData.get("session_id") || null;
  const files = formData.getAll("files") || [];

  // fake OCR delay
  await new Promise((r) => setTimeout(r, 1200));

  return Response.json({
    ocr_status: "success",
    extracted_data: {
      pan: "ABCDE1234F",
      salary: 50000,
      employer: "Sample Pvt Ltd",
    },
    files_received: files.length,
    session_id,
  });
}

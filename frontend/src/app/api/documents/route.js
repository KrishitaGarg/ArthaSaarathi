export async function POST(request) {
  const formData = await request.formData();
  const files = formData.getAll("files") || [];

  // Fake OCR processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return Response.json({
    ocr_status: "success",
    extracted_data: {
      pan: "ABCDE1234F",
      salary: 50000,
      employer: "Sample Pvt Ltd",
    },
    files_received: files.length,
  });
}

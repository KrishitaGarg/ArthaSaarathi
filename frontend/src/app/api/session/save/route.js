export async function POST(request) {
  const { session_id, stage } = await request.json();

  // For now just echo back; later you can store in DB/Firebase
  return Response.json({
    save_status: "ok",
    session_id,
    stage,
  });
}

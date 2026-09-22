import { NextResponse } from "next/server";
import { db } from "@/modules/shared/infrastructure/db";

export async function GET() {
  let dbStatus: "connected" | "disconnected" = "disconnected";

  try {
    await db.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
  }

  const responsePayload = {
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  };

  const statusCode = dbStatus === "connected" ? 200 : 503;
  return NextResponse.json(responsePayload, { status: statusCode });
}

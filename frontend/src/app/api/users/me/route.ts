import { NextRequest } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export async function GET(req: NextRequest) {
  return backendRequest(req, "/users/me");
}
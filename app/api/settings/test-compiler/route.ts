import { NextResponse } from "next/server";
import { getCompilerProvider } from "@/lib/compiler";

export async function POST() {
  try {
    const compiler = getCompilerProvider();
    const result = await compiler.testConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to connect to compiler provider.",
      },
      { status: 500 }
    );
  }
}

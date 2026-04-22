import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addPaidCustomer, isPaidCustomer } from "@/lib/db";
import { unlockInputSchema } from "@/lib/db/schema";

const ACCESS_COOKIE = "smallbus_access";

export async function POST(request: Request) {
  try {
    const payload = unlockInputSchema.parse(await request.json());
    const paid = await isPaidCustomer(payload.email);
    const isDev = process.env.NODE_ENV !== "production";

    if (!paid && !isDev) {
      return NextResponse.json(
        {
          error: "No completed payment found for this email yet."
        },
        { status: 403 }
      );
    }

    if (!paid && isDev) {
      await addPaidCustomer(payload.email, "manual-dev-unlock");
    }

    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE, "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to unlock access";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);

  return NextResponse.json({ ok: true });
}

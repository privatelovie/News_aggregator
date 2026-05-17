import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Enter a valid name, email, and password." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account already exists for this email." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash
      }
    });

    return NextResponse.json({ message: "Account created." }, { status: 201 });
  } catch (error) {
    console.error("[register]", error);

    return NextResponse.json(
      {
        message:
          "Unable to create account. Check that DATABASE_URL is correct and migrations have run."
      },
      { status: 500 }
    );
  }
}

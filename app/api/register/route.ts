import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { setSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80),

  age: z.number().int().min(13).max(100),
  gender: z.string().min(1),
  education: z.string().min(1),
  occupation: z.string().min(1),
  gamingExperience: z.string().min(1),
  computerUsage: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Niepoprawne dane" }, { status: 400 });
  }

  const data = parsed.data;

  const exists = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (exists) {
    return NextResponse.json(
      { error: "Konto z tym adresem email już istnieje" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: await hashPassword(data.password),

      age: data.age,
      gender: data.gender,
      education: data.education,
      occupation: data.occupation,
      gamingExperience: data.gamingExperience,
      computerUsage: data.computerUsage,
    },
  });

  await setSessionUserId(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
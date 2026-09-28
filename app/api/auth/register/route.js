import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';

const DEFAULT_BRANDS = [
  'Tenda',
  'Huawei',
  'TP-Link',
  'MikroTik',
  'ZTE',
  'Ubiquiti',
  'D-Link',
  'Netgear',
];

export async function POST(req) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and auto-seed standard brands
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
        },
      });

      // Create default brand list for new account
      for (const brandName of DEFAULT_BRANDS) {
        await tx.brand.create({
          data: {
            name: brandName,
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred' },
      { status: 500 }
    );
  }
}

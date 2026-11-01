import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/authService';
import { setSessionCookie } from '@/lib/auth';
import { errorText } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AuthService.login(body);

    const response = NextResponse.json({
      success: true,
      user: result.user,
      redirectTo: result.redirectTo,
    });

    setSessionCookie(response, result.token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: errorText(error, 'loginFailed') },
      { status: 401 }
    );
  }
}

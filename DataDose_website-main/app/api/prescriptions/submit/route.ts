import { NextResponse } from 'next/server';
import { enforceDailyQuota } from '@/lib/quota';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userEmail = body?.userEmail;
    const medications = Array.isArray(body?.medications) ? body.medications : [];

    if (!medications.length) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Please add at least one medication.' },
        { status: 400 }
      );
    }

    const quota = await enforceDailyQuota(userEmail, false);
    if (quota.exceeded) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: '403 Forbidden: QUOTA_EXCEEDED' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prescription submitted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'SUBMIT_FAILED', message: error?.message || 'Submit failed.' },
      { status: 500 }
    );
  }
}

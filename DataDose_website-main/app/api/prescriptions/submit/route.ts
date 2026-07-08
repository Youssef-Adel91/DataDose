import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';
import { enforceDailyQuota } from '@/lib/quota';

export async function POST(req: Request) {
  // ── Authentication ──
  const auth = await requireAuth(['PHYSICIAN']);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const patientEmail = body?.patientEmail;
    const medications = Array.isArray(body?.medications) ? body.medications : [];

    if (!medications.length) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Please add at least one medication.' },
        { status: 400 }
      );
    }

    const quota = await enforceDailyQuota(auth.email, false);
    if (quota.exceeded) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: 'Daily prescription limit reached. Please try again tomorrow.' },
        { status: 403 }
      );
    }

    // Persist prescription to database
    try {
      const drugNames = medications.map((m: any) => typeof m === 'string' ? m : m.name || '');
      
      await prisma.prescriptionHistory.create({
        data: {
          doctorId: auth.userId,
          patientId: patientEmail
            ? (await prisma.user.findUnique({ where: { email: patientEmail } }))?.id || auth.userId
            : auth.userId,
          drugs: drugNames,
          diagnosis: body?.diagnosis || null,
        },
      });
    } catch (dbError) {
      console.error('[prescription-submit] DB Error:', dbError);
      // Continue even if DB write fails — don't block the workflow
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

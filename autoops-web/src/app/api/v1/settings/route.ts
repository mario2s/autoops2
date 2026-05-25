import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { app_settings } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { handleError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await validateApiRequest(request);

    const row = await db
      .select({ value: app_settings.value })
      .from(app_settings)
      .where(eq(app_settings.key, 'hourly_rate'))
      .limit(1);

    const hourlyRate = parseFloat(row[0]?.value ?? '30');

    return NextResponse.json({ hourlyRate });
  } catch (err) {
    return handleError(err);
  }
}

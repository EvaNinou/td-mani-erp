import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isValidDate(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || '')) {
    return false;
  }

  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function GET(request) {
  try {
    const userId = process.env.MYDATA_USER_ID;
    const subscriptionKey = process.env.MYDATA_SUBSCRIPTION_KEY;

    if (!userId || !subscriptionKey) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Δεν έχουν ρυθμιστεί οι κωδικοί myDATA στο Vercel.'
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Οι ημερομηνίες πρέπει να είναι σε μορφή dd/MM/yyyy.'
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      mark: '0',
      dateFrom,
      dateTo
    });

    const optionalParams = [
      'entityVatNumber',
      'counterVatNumber',
      'invType',
      'maxMark',
      'nextPartitionKey',
      'nextRowKey'
    ];

    for (const key of optionalParams) {
      const value = searchParams.get(key);
      if (value) {
        params.set(key, value);
      }
    }

    const myDataUrl =
      `https://mydatapi.aade.gr/myDATA/RequestTransmittedDocs?${params.toString()}`;

    const response = await fetch(myDataUrl, {
      method: 'GET',
      headers: {
        'aade-user-id': userId,
        'ocp-apim-subscription-key': subscriptionKey,
        Accept: 'application/xml'
      },
      cache: 'no-store'
    });

    const body = await response.text();

    if (!response.ok) {
      console.error(
        'myDATA RequestTransmittedDocs error:',
        response.status,
        body.slice(0, 1000)
      );

      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: `Η ΑΑΔΕ απέρριψε την ανάκτηση εσόδων (HTTP ${response.status}).`
        },
        { status: response.status }
      );
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('myDATA income connection error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Αποτυχία σύνδεσης με τα έσοδα myDATA.'
      },
      { status: 500 }
    );
  }
}

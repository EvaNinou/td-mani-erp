import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isValidDate(value) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value || '');
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
          error: 'Χρειάζονται dateFrom και dateTo σε μορφή dd/MM/yyyy.'
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      dateFrom,
      dateTo
    });

    const optionalParams = [
      'counterVatNumber',
      'entityVatNumber',
      'invType',
      'nextPartitionKey',
      'nextRowKey'
    ];

    optionalParams.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    const myDataUrl =
      `https://mydatapi.aade.gr/myDATA/RequestMyExpenses?${params.toString()}`;

    const response = await fetch(myDataUrl, {
      method: 'GET',
      headers: {
        'aade-user-id': userId,
        'ocp-apim-subscription-key': subscriptionKey,
        Accept: 'application/xml'
      },
      cache: 'no-store'
    });

    const xml = await response.text();

    if (!response.ok) {
      console.error('myDATA error:', response.status);

      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: 'Η ΑΑΔΕ δεν δέχτηκε το αίτημα myDATA.'
        },
        { status: response.status }
      );
    }

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('myDATA connection error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Αποτυχία σύνδεσης με το myDATA.'
      },
      { status: 500 }
    );
  }
}

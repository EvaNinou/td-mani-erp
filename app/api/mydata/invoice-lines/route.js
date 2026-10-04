import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function buildMyDataUrl(downloadUrl) {
  const clean = downloadUrl.trim().replace(/\/+$/, '');

  if (clean.endsWith('/myDATA')) {
    return clean;
  }

  return `${clean}/myDATA`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const downloadingInvoiceUrl = body?.downloadingInvoiceUrl;

    if (!downloadingInvoiceUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Δεν δόθηκε σύνδεσμος παραστατικού.',
        },
        { status: 400 }
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(downloadingInvoiceUrl);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'Ο σύνδεσμος του παραστατικού δεν είναι έγκυρος.',
        },
        { status: 400 }
      );
    }

    // Ασφάλεια: επιτρέπουμε μόνο HTTPS.
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Μη επιτρεπτός σύνδεσμος παραστατικού.',
        },
        { status: 400 }
      );
    }

    const myDataUrl = buildMyDataUrl(downloadingInvoiceUrl);

    const response = await fetch(myDataUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/xml, text/plain, */*',
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    const data = await response.text();

    if (!response.ok) {
      console.error(
        'Invoice lines download error:',
        response.status,
        contentType
      );

      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: 'Δεν ήταν δυνατή η λήψη των αναλυτικών γραμμών.',
        },
        { status: response.status }
      );
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Invoice lines error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Αποτυχία ανάγνωσης των υλικών του παραστατικού.',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const userId = process.env.MYDATA_USER_ID;
    const subscriptionKey = process.env.MYDATA_SUBSCRIPTION_KEY;

    if (!userId || !subscriptionKey) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Δεν έχουν ρυθμιστεί οι κωδικοί myDATA στο Vercel.',
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mark = searchParams.get('mark');

    if (!mark || !/^\d+$/.test(mark)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Δεν δόθηκε έγκυρο MARK παραστατικού.',
        },
        { status: 400 }
      );
    }

    // Η RequestDocs επιστρέφει MARK μεγαλύτερα από το "mark"
    // και έως το "maxMark".
    // Άρα για να πάρουμε ΜΟΝΟ το συγκεκριμένο:
    // mark = ζητούμενο MARK - 1
    // maxMark = ζητούμενο MARK
    const requestedMark = BigInt(mark);
    const startMark = requestedMark - 1n;

    const params = new URLSearchParams({
      mark: startMark.toString(),
      maxMark: requestedMark.toString(),
    });

    const myDataUrl =
      `https://mydatapi.aade.gr/myDATA/RequestDocs?${params.toString()}`;

    const response = await fetch(myDataUrl, {
      method: 'GET',
      headers: {
        'aade-user-id': userId,
        'ocp-apim-subscription-key': subscriptionKey,
        Accept: 'application/xml',
      },
      cache: 'no-store',
    });

    const xml = await response.text();

    if (!response.ok) {
      console.error('myDATA RequestDocs error:', response.status);

      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: 'Η ΑΑΔΕ δεν δέχτηκε το αίτημα για το παραστατικό.',
        },
        { status: response.status }
      );
    }

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('myDATA document error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Αποτυχία λήψης του παραστατικού από το myDATA.',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isDigits(value) {
  return /^\d+$/.test(String(value || ''));
}

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
    const minMark = searchParams.get('minMark');
    const maxMark = searchParams.get('maxMark');

    let startMark;
    let endMark;

    // 1. ΛΗΨΗ ΕΝΟΣ ΣΥΓΚΕΚΡΙΜΕΝΟΥ ΠΑΡΑΣΤΑΤΙΚΟΥ
    // Διατηρούμε ακριβώς τη λειτουργία που ήδη είχαμε.
    if (mark) {
      if (!isDigits(mark)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Δεν δόθηκε έγκυρο MARK παραστατικού.',
          },
          { status: 400 }
        );
      }

      const requestedMark = BigInt(mark);

      if (requestedMark <= 0n) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Το MARK πρέπει να είναι μεγαλύτερο από μηδέν.',
          },
          { status: 400 }
        );
      }

      startMark = requestedMark - 1n;
      endMark = requestedMark;
    }

    // 2. ΛΗΨΗ ΕΥΡΟΥΣ ΠΑΡΑΣΤΑΤΙΚΩΝ
    else if (minMark && maxMark) {
      if (!isDigits(minMark) || !isDigits(maxMark)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Δεν δόθηκε έγκυρο εύρος MARK.',
          },
          { status: 400 }
        );
      }

      const requestedMinMark = BigInt(minMark);
      const requestedMaxMark = BigInt(maxMark);

      if (
        requestedMinMark <= 0n ||
        requestedMaxMark <= 0n ||
        requestedMaxMark < requestedMinMark
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Το εύρος MARK δεν είναι έγκυρο.',
          },
          { status: 400 }
        );
      }

      // Η RequestDocs επιστρέφει εγγραφές με MARK
      // μεγαλύτερο από το mark.
      // Για να συμπεριλάβουμε και το minMark,
      // ξεκινάμε από minMark - 1.
      startMark = requestedMinMark - 1n;
      endMark = requestedMaxMark;
    }

    else {
      return NextResponse.json(
        {
          ok: false,
          error: 'Χρειάζεται mark ή minMark/maxMark.',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      mark: startMark.toString(),
      maxMark: endMark.toString(),
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
          error: 'Η ΑΑΔΕ δεν δέχτηκε το αίτημα για τα παραστατικά.',
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
        error: 'Αποτυχία λήψης παραστατικών από το myDATA.',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// SAFE MODE:
// true = δημιουργεί μόνο το XML.
// ΔΕΝ στέλνει τίποτα στην ΑΑΔΕ.
const SAFE_MODE = true;

function xmlEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

function validTime(value) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value || '');
}

function validAfm(value) {
  return /^\d{9}$/.test(String(value || ''));
}

function addressXml(tag, address) {
  if (!address?.postalCode || !address?.city) return '';

  return `
        <${tag}>
          ${
            address.street
              ? `<street>${xmlEscape(address.street)}</street>`
              : ''
          }
          ${
            address.number
              ? `<number>${xmlEscape(address.number)}</number>`
              : ''
          }
          <postalCode>${xmlEscape(address.postalCode)}</postalCode>
          <city>${xmlEscape(address.city)}</city>
        </${tag}>`;
}

function measurementUnit(unit = '') {
  const u = String(unit).trim().toLowerCase();

  if (
    ['τεμ.', 'τεμ', 'τεμάχια', 'τεμαχια', 'pcs', 'piece', 'pieces'].includes(u)
  ) {
    return 1;
  }

  if (['kg', 'κιλά', 'κιλα', 'κιλό', 'κιλο'].includes(u)) {
    return 2;
  }

  if (['lt', 'l', 'λίτρα', 'λιτρα'].includes(u)) {
    return 3;
  }

  if (['m', 'μ', 'μέτρα', 'μετρα'].includes(u)) {
    return 4;
  }

  if (['m²', 'm2', 'τ.μ.', 'τμ'].includes(u)) {
    return 5;
  }

  if (['m³', 'm3', 'κ.μ.', 'κμ'].includes(u)) {
    return 6;
  }

  return 7;
}

function buildInvoiceXml(data) {
  const {
    series,
    documentNumber,
    issueDate,
    issueTime,
    recipientAfm,
    dispatchDate,
    dispatchTime,
    vehicleNumber,
    movementPurpose,
    loadingAddress,
    deliveryAddress,
    lines
  } = data;

  const issuerVatNumber =
    process.env.MYDATA_ENTITY_VAT_NUMBER || '801853358';

  const rows = lines
    .map((line, index) => {
      const unitCode = measurementUnit(line.unit);

      const otherUnit =
        unitCode === 7
          ? `
          <otherMeasurementUnitQuantity>${Math.max(
            1,
            Math.round(Number(line.quantity))
          )}</otherMeasurementUnitQuantity>
          <otherMeasurementUnitTitle>${xmlEscape(
            line.unit || 'Λοιπή μονάδα'
          )}</otherMeasurementUnitTitle>`
          : '';

      return `
      <invoiceDetails>
        <lineNumber>${index + 1}</lineNumber>
        <quantity>${Number(line.quantity)}</quantity>
        <measurementUnit>${unitCode}</measurementUnit>
        <netValue>0.00</netValue>
        <vatCategory>8</vatCategory>
        <vatAmount>0.00</vatAmount>
        <itemDescr>${xmlEscape(line.itemName)}</itemDescr>
        ${
          line.itemCode
            ? `<itemCode>${xmlEscape(line.itemCode)}</itemCode>`
            : ''
        }
        ${otherUnit}
      </invoiceDetails>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc
  xmlns="http://www.aade.gr/myDATA/invoice/v1.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
>
  <invoice>

    <issuer>
      <vatNumber>${issuerVatNumber}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </issuer>

    ${
      recipientAfm
        ? `
    <counterpart>
      <vatNumber>${xmlEscape(recipientAfm)}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </counterpart>`
        : ''
    }

    <invoiceHeader>
      <series>${xmlEscape(series || 'ΔΔ')}</series>
      <aa>${xmlEscape(documentNumber)}</aa>
      <issueDate>${issueDate}</issueDate>

      <invoiceType>9.3</invoiceType>

      <dispatchDate>${dispatchDate || issueDate}</dispatchDate>
      <dispatchTime>${dispatchTime || issueTime}:00</dispatchTime>

      ${
        vehicleNumber
          ? `<vehicleNumber>${xmlEscape(vehicleNumber)}</vehicleNumber>`
          : ''
      }

      <movePurpose>19</movePurpose>

      <otherMovePurposeTitle>${xmlEscape(
        movementPurpose || 'Διακίνηση υλικών σε έργο'
      )}</otherMovePurposeTitle>

      <otherDeliveryNoteHeader>

        ${addressXml('loadingAddress', loadingAddress)}

        ${addressXml('deliveryAddress', deliveryAddress)}

      </otherDeliveryNoteHeader>

    </invoiceHeader>

    ${rows}

    <invoiceSummary>
      <totalNetValue>0.00</totalNetValue>
      <totalVatAmount>0.00</totalVatAmount>
      <totalWithheldAmount>0.00</totalWithheldAmount>
      <totalFeesAmount>0.00</totalFeesAmount>
      <totalStampDutyAmount>0.00</totalStampDutyAmount>
      <totalOtherTaxesAmount>0.00</totalOtherTaxesAmount>
      <totalDeductionsAmount>0.00</totalDeductionsAmount>
      <totalGrossValue>0.00</totalGrossValue>
    </invoiceSummary>

  </invoice>
</InvoicesDoc>`;
}

export async function POST(request) {
  try {
    const userId = process.env.MYDATA_USER_ID;
    const subscriptionKey =
      process.env.MYDATA_SUBSCRIPTION_KEY;

    if (!userId || !subscriptionKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Δεν έχουν ρυθμιστεί οι κωδικοί myDATA στο Vercel.'
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      series = 'ΔΔ',
      documentNumber,
      issueDate,
      issueTime,
      recipientAfm = '',
      dispatchDate,
      dispatchTime,
      loadingAddress,
      deliveryAddress,
      lines = []
    } = body;

    if (!documentNumber) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Λείπει ο αριθμός του Δελτίου Διακίνησης.'
        },
        { status: 400 }
      );
    }

    if (!validDate(issueDate)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η ημερομηνία έκδοσης πρέπει να είναι YYYY-MM-DD.'
        },
        { status: 400 }
      );
    }

    if (!validTime(issueTime)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η ώρα έκδοσης πρέπει να είναι HH:MM.'
        },
        { status: 400 }
      );
    }

    if (dispatchDate && !validDate(dispatchDate)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η ημερομηνία αποστολής πρέπει να είναι YYYY-MM-DD.'
        },
        { status: 400 }
      );
    }

    if (dispatchTime && !validTime(dispatchTime)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η ώρα αποστολής πρέπει να είναι HH:MM.'
        },
        { status: 400 }
      );
    }

    if (recipientAfm && !validAfm(recipientAfm)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Το ΑΦΜ παραλήπτη πρέπει να έχει 9 ψηφία.'
        },
        { status: 400 }
      );
    }

    if (
      !loadingAddress?.postalCode ||
      !loadingAddress?.city
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Χρειάζονται ΤΚ και πόλη στη διεύθυνση φόρτωσης.'
        },
        { status: 400 }
      );
    }

    if (
      !deliveryAddress?.postalCode ||
      !deliveryAddress?.city
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Χρειάζονται ΤΚ και πόλη στη διεύθυνση παράδοσης.'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Το Δελτίο Διακίνησης πρέπει να έχει τουλάχιστον ένα υλικό.'
        },
        { status: 400 }
      );
    }

    for (const line of lines) {
      if (
        !line?.itemName ||
        !(Number(line?.quantity) > 0)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Κάθε γραμμή χρειάζεται υλικό και ποσότητα μεγαλύτερη από 0.'
          },
          { status: 400 }
        );
      }
    }

    const normalized = {
      ...body,
      series,
      documentNumber: String(documentNumber),
      issueDate,
      issueTime,
      recipientAfm,
      dispatchDate: dispatchDate || issueDate,
      dispatchTime: dispatchTime || issueTime,
      lines
    };

    const xml = buildInvoiceXml(normalized);

    /*
      SAFE MODE

      Σταματάμε εδώ.

      ΔΕΝ γίνεται fetch προς:
      /myDATA/SendInvoices

      Άρα ΔΕΝ εκδίδεται πραγματικό παραστατικό.
    */

    if (SAFE_MODE) {
      return NextResponse.json({
        ok: true,
        safeMode: true,
        transmitted: false,

        message:
          'SAFE MODE: Το XML δημιουργήθηκε, αλλά ΔΕΝ διαβιβάστηκε στην ΑΑΔΕ.',

        document: {
          invoiceType: '9.3',
          series,
          aa: String(documentNumber),
          issueDate,
          dispatchDate: dispatchDate || issueDate,
          dispatchTime: dispatchTime || issueTime,
          movePurpose: 19
        },

        xml
      });
    }

    /*
      Η πραγματική SendInvoices θα ενεργοποιηθεί
      μόνο αφού ελέγξουμε πρώτα το XML.
    */

    return NextResponse.json(
      {
        ok: false,
        error:
          'Η πραγματική διαβίβαση δεν έχει ενεργοποιηθεί ακόμη.'
      },
      { status: 503 }
    );
  } catch (error) {
    console.error(
      'Delivery note myDATA error:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          'Αποτυχία δημιουργίας του Δελτίου Διακίνησης για myDATA.'
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ΜΟΝΟ ΔΟΚΙΜΑΣΤΙΚΟ ΠΕΡΙΒΑΛΛΟΝ ΑΑΔΕ
const TEST_MYDATA_URL =
  'https://mydataapidev.aade.gr/SendInvoices';

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

function normalizeTime(value) {
  const time = String(value || '').trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }

  return time;
}

function addressXml(tag, address) {
  if (
    !address?.street ||
    !address?.number ||
    !address?.postalCode ||
    !address?.city
  ) {
    return '';
  }

  return `
        <${tag}>
          <street>${xmlEscape(address.street)}</street>
          <number>${xmlEscape(address.number)}</number>
          <postalCode>${xmlEscape(address.postalCode)}</postalCode>
          <city>${xmlEscape(address.city)}</city>
        </${tag}>`;
}

function measurementUnit(unit = '') {
  const u = String(unit).trim().toLowerCase();

  if (
    [
      'τεμ.',
      'τεμ',
      'τεμάχια',
      'τεμαχια',
      'pcs',
      'piece',
      'pieces'
    ].includes(u)
  ) {
    return 1;
  }

  if (
    ['kg', 'κιλά', 'κιλα', 'κιλό', 'κιλο'].includes(u)
  ) {
    return 2;
  }

  if (
    ['lt', 'l', 'λίτρα', 'λιτρα'].includes(u)
  ) {
    return 3;
  }

  if (
    ['m', 'μ', 'μέτρα', 'μετρα'].includes(u)
  ) {
    return 4;
  }

  if (
    ['m²', 'm2', 'τ.μ.', 'τμ', 'm^2'].includes(u)
  ) {
    return 5;
  }

  if (
    ['m³', 'm3', 'κ.μ.', 'κμ', 'm^3'].includes(u)
  ) {
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
    recipientName,
    recipientBranch,
    recipientAddress,
    dispatchDate,
    dispatchTime,
    vehicleNumber,
    movementPurposeTitle,
    loadingAddress,
    deliveryAddress,
    lines
  } = data;

  const issuerVatNumber =
    process.env.MYDATA_ENTITY_VAT_NUMBER || '801853358';

  const issuerName = 'TD MANI E.E.';

  const issuerAddress = {
    street: 'Πλάκες',
    number: '0',
    postalCode: '84800',
    city: 'Μήλος'
  };

  const rows = lines
    .map((line, index) => {
      const quantity = Number(line.quantity);
      const unitCode = measurementUnit(line.unit);

      const otherUnit =
        unitCode === 7
          ? `
      <otherMeasurementUnitQuantity>${quantity}</otherMeasurementUnitQuantity>
      <otherMeasurementUnitTitle>${xmlEscape(
        line.unit || 'Λοιπή μονάδα'
      )}</otherMeasurementUnitTitle>`
          : '';

      return `
  <invoiceDetails>
    <lineNumber>${index + 1}</lineNumber>
    ${
      line.itemCode
        ? `<itemCode>${xmlEscape(line.itemCode)}</itemCode>`
        : ''
    }
    <itemDescr>${xmlEscape(line.itemName)}</itemDescr>
    <quantity>${quantity}</quantity>
    <measurementUnit>${unitCode}</measurementUnit>
    <netValue>0.00</netValue>
    <vatCategory>8</vatCategory>
    <vatAmount>0.00</vatAmount>
    ${otherUnit}
    <incomeClassification>
  <icls:classificationType>E3_561_007</icls:classificationType>
  <icls:classificationCategory>category1_95</icls:classificationCategory>
  <icls:amount>0.00</icls:amount>
</incomeClassification>
    <movePurposeLine>19</movePurposeLine>
    <otherMovePurposeLineTitle>Μεταφορά υλικών σε έργο</otherMovePurposeLineTitle>
  </invoiceDetails>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc
  xmlns="http://www.aade.gr/myDATA/invoice/v1.0"
  xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <invoice>

    <issuer>
      <vatNumber>${xmlEscape(issuerVatNumber)}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
      <name>${xmlEscape(issuerName)}</name>
      <address>
        <street>${xmlEscape(issuerAddress.street)}</street>
        <number>${xmlEscape(issuerAddress.number)}</number>
        <postalCode>${xmlEscape(issuerAddress.postalCode)}</postalCode>
        <city>${xmlEscape(issuerAddress.city)}</city>
      </address>
    </issuer>

    ${
      recipientAfm
        ? `
    <counterpart>
      <vatNumber>${xmlEscape(recipientAfm)}</vatNumber>
      <country>GR</country>
      <branch>${xmlEscape(recipientBranch || '0')}</branch>
      <name>${xmlEscape(recipientName || '')}</name>
      ${addressXml('address', recipientAddress)}
    </counterpart>`
        : ''
    }

    <invoiceHeader>
      <series>${xmlEscape(series || 'Δ')}</series>
      <aa>${xmlEscape(documentNumber)}</aa>
      <issueDate>${issueDate}</issueDate>
      <invoiceType>9.3</invoiceType>

      <dispatchDate>${
        dispatchDate || issueDate
      }</dispatchDate>

      <dispatchTime>${normalizeTime(
        dispatchTime || issueTime
      )}</dispatchTime>

      ${
        vehicleNumber
          ? `<vehicleNumber>${xmlEscape(
              vehicleNumber
            )}</vehicleNumber>`
          : ''
      }

      <movePurpose>19</movePurpose>

      <otherDeliveryNoteHeader>
        ${addressXml(
          'loadingAddress',
          loadingAddress
        )}

        ${addressXml(
          'deliveryAddress',
          deliveryAddress
        )}
      </otherDeliveryNoteHeader>

      <otherMovePurposeTitle>${xmlEscape(
        movementPurposeTitle ||
          'Μεταφορά υλικών σε έργο'
      )}</otherMovePurposeTitle>

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
    /*
      ΠΡΟΣΟΧΗ:
      Χρησιμοποιούμε ΑΠΟΚΛΕΙΣΤΙΚΑ
      τους TEST κωδικούς.

      Δεν υπάρχει fallback στους
      production κωδικούς.
    */

    const testUserId =
      process.env.MYDATA_TEST_USER_ID;

    const testSubscriptionKey =
      process.env.MYDATA_TEST_SUBSCRIPTION_KEY;

    if (!testUserId || !testSubscriptionKey) {
      return NextResponse.json(
        {
          ok: false,
          testMode: true,
          transmitted: false,
          error:
            'Δεν έχουν ρυθμιστεί οι TEST κωδικοί myDATA στο Vercel.'
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      series = 'Δ',
      documentNumber,
      issueDate,
      issueTime,
      recipientAfm = '',
      recipientName = '',
      recipientBranch = '0',
      recipientAddress,
      dispatchDate,
      dispatchTime,
      vehicleNumber = '',
      loadingAddress,
      deliveryAddress,
      lines = []
    } = body;

    const movementPurposeTitle =
      body.movementPurposeTitle ||
      'Μεταφορά υλικών σε έργο';

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

    if (series !== 'Δ') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η σειρά του Δελτίου πρέπει να είναι Δ.'
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

    if (
      dispatchDate &&
      !validDate(dispatchDate)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η ημερομηνία διακίνησης πρέπει να είναι YYYY-MM-DD.'
        },
        { status: 400 }
      );
    }

    if (
      dispatchTime &&
      !validTime(dispatchTime)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Η ώρα διακίνησης πρέπει να είναι HH:MM.'
        },
        { status: 400 }
      );
    }

    if (
      recipientAfm &&
      !validAfm(recipientAfm)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Το ΑΦΜ παραλήπτη πρέπει να έχει 9 ψηφία.'
        },
        { status: 400 }
      );
    }

    if (recipientAfm && !recipientName.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Χρειάζεται Επωνυμία / Ονοματεπώνυμο παραλήπτη.'
        },
        { status: 400 }
      );
    }

    if (
      recipientAfm &&
      (
        !recipientAddress?.street ||
        !recipientAddress?.number ||
        !recipientAddress?.city ||
        !recipientAddress?.postalCode
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Χρειάζονται Οδός, Αριθμός, Πόλη και Τ.Κ. στη διεύθυνση παραλήπτη.'
        },
        { status: 400 }
      );
    }

    if (
      !loadingAddress?.street ||
      !loadingAddress?.number ||
      !loadingAddress?.postalCode ||
      !loadingAddress?.city
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Χρειάζονται Οδός, Αριθμός, Πόλη και Τ.Κ. στον Τόπο Φόρτωσης.'
        },
        { status: 400 }
      );
    }

    if (
      !deliveryAddress?.street ||
      !deliveryAddress?.number ||
      !deliveryAddress?.postalCode ||
      !deliveryAddress?.city
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Χρειάζονται Οδός, Αριθμός, Πόλη και Τ.Κ. στον Τόπο Παράδοσης.'
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(lines) ||
      lines.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Το Δελτίο πρέπει να έχει τουλάχιστον ένα υλικό.'
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
      series: 'Δ',
      documentNumber:
        String(documentNumber),
      issueDate,
      issueTime,
      recipientAfm,
      recipientName,
      recipientBranch,
      recipientAddress,
      dispatchDate:
        dispatchDate || issueDate,
      dispatchTime:
        dispatchTime || issueTime,
      vehicleNumber,
      movementPurposeTitle,
      loadingAddress,
      deliveryAddress,
      lines
    };

    const xml =
      buildInvoiceXml(normalized);

    /*
      ΑΠΟΣΤΟΛΗ ΜΟΝΟ ΣΤΟ TEST / DEV
      ΠΕΡΙΒΑΛΛΟΝ ΤΗΣ ΑΑΔΕ
    */

    const aadeResponse = await fetch(
      TEST_MYDATA_URL,
      {
        method: 'POST',

        headers: {
          'aade-user-id': testUserId,

          'ocp-apim-subscription-key':
            testSubscriptionKey,

          'Content-Type':
            'application/xml',

          Accept:
            'application/xml'
        },

        body: xml,

        cache: 'no-store'
      }
    );

    const responseText =
      await aadeResponse.text();

    /*
      Δεν θεωρούμε αυτόματα επιτυχία
      μόνο επειδή πήραμε HTTP 200.

      Επιστρέφουμε την απάντηση της
      TEST ΑΑΔΕ για να τη δούμε.
    */

    return NextResponse.json({
      ok: aadeResponse.ok,

      testMode: true,

      production: false,

      transmittedToTestEnvironment:
        true,

      httpStatus:
        aadeResponse.status,

      message:
        aadeResponse.ok
          ? 'Η TEST ΑΑΔΕ απάντησε στο αίτημα.'
          : 'Η TEST ΑΑΔΕ επέστρεψε σφάλμα.',

      aadeResponse:
        responseText
    });
  } catch (error) {
    console.error(
      'TEST Delivery Note myDATA error:',
      error
    );

    return NextResponse.json(
      {
        ok: false,

        testMode: true,

        production: false,

        transmittedToTestEnvironment:
          false,

        error:
          'Αποτυχία επικοινωνίας με το δοκιμαστικό περιβάλλον myDATA.'
      },
      { status: 500 }
    );
  }
}

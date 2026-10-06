import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// myDATA endpoints
const TEST_MYDATA_URL =
  'https://mydataapidev.aade.gr/SendInvoices';

const PRODUCTION_MYDATA_URL =
  'https://mydatapi.aade.gr/myDATA/SendInvoices';

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
  <icls:classificationCategory>category3</icls:classificationCategory>
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

  <incomeClassification>
    <icls:classificationCategory>category3</icls:classificationCategory>
    <icls:amount>0.00</icls:amount>
  </incomeClassification>
</invoiceSummary>

  </invoice>
</InvoicesDoc>`;
}

export async function POST(request) {
  try {
    /*
      ΑΣΦΑΛΕΙΑ:

      Από προεπιλογή το ERP λειτουργεί σε TEST.

      Για να ενεργοποιηθεί η πραγματική ΑΑΔΕ
      πρέπει να υπάρχουν ΤΑΥΤΟΧΡΟΝΑ στο Vercel:

      MYDATA_MODE=production
      MYDATA_PRODUCTION_ENABLED=YES

      Αν λείπει έστω και ένα από τα δύο,
      χρησιμοποιείται το TEST περιβάλλον.
    */

    const productionMode =
      process.env.MYDATA_MODE === 'production' &&
      process.env.MYDATA_PRODUCTION_ENABLED === 'YES';

    const userId = productionMode
      ? process.env.MYDATA_USER_ID
      : process.env.MYDATA_TEST_USER_ID;

    const subscriptionKey = productionMode
      ? process.env.MYDATA_SUBSCRIPTION_KEY
      : process.env.MYDATA_TEST_SUBSCRIPTION_KEY;

    const myDataUrl = productionMode
      ? PRODUCTION_MYDATA_URL
      : TEST_MYDATA_URL;

    if (!userId || !subscriptionKey) {
      return NextResponse.json(
        {
          ok: false,
          testMode: !productionMode,
          production: productionMode,
          transmitted: false,
          error: productionMode
            ? 'Δεν έχουν ρυθμιστεί οι PRODUCTION κωδικοί myDATA στο Vercel.'
            : 'Δεν έχουν ρυθμιστεί οι TEST κωδικοί myDATA στο Vercel.'
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

    const aadeResponse = await fetch(
      myDataUrl,
      {
        method: 'POST',

        headers: {
          'aade-user-id': userId,

          'ocp-apim-subscription-key':
            subscriptionKey,

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

    const decodedResponse = String(responseText || '')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'")
      .replaceAll('&amp;', '&');

    function readResponseTag(tag) {
      const match = decodedResponse.match(
        new RegExp(
          `<${tag}>([\\s\\S]*?)<\\/${tag}>`,
          'i'
        )
      );

      return match
        ? String(match[1] || '').trim()
        : '';
    }

    const statusCode =
      readResponseTag('statusCode');

    const invoiceUid =
      readResponseTag('invoiceUid');

    const invoiceMark =
      readResponseTag('invoiceMark');

    const qrUrl =
      readResponseTag('qrUrl');

    const success =
      aadeResponse.ok &&
      statusCode.toLowerCase() === 'success' &&
      Boolean(invoiceUid) &&
      Boolean(invoiceMark);

    return NextResponse.json({
      ok: success,

      testMode: !productionMode,

      production: productionMode,

      transmittedToTestEnvironment:
        !productionMode,

      httpStatus:
        aadeResponse.status,

      statusCode,

      invoiceUid,

      invoiceMark,

      qrUrl,

      message: success
        ? productionMode
          ? 'Η ΑΑΔΕ δέχτηκε το πραγματικό Δελτίο Διακίνησης.'
          : 'Η TEST ΑΑΔΕ δέχτηκε το Δελτίο Διακίνησης.'
        : productionMode
          ? 'Η ΑΑΔΕ επέστρεψε σφάλμα.'
          : 'Η TEST ΑΑΔΕ επέστρεψε σφάλμα.',

      aadeResponse:
        responseText
    });
  } catch (error) {
    const productionMode =
      process.env.MYDATA_MODE === 'production' &&
      process.env.MYDATA_PRODUCTION_ENABLED === 'YES';

    console.error(
      productionMode
        ? 'PRODUCTION Delivery Note myDATA error:'
        : 'TEST Delivery Note myDATA error:',
      error
    );

    return NextResponse.json(
      {
        ok: false,

        testMode: !productionMode,

        production: productionMode,

        transmittedToTestEnvironment:
          false,

        error: productionMode
          ? 'Αποτυχία επικοινωνίας με το παραγωγικό περιβάλλον myDATA.'
          : 'Αποτυχία επικοινωνίας με το δοκιμαστικό περιβάλλον myDATA.'
      },
      { status: 500 }
    );
  }
}

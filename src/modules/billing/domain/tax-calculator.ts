export interface InvoiceLineInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // e.g., 21.0, 10.5, 0.0
}

export interface CalculatedInvoiceLine extends InvoiceLineInput {
  subtotal: number;
  taxAmount: number;
  totalLine: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxTotal: number;
  total: number;
  lines: CalculatedInvoiceLine[];
}

/**
 * Pure calculation of VAT tax breakdown for AFIP invoice lines.
 * Price is assumed net (without VAT) or gross depending on calculation.
 * Standard AFIP model: Net Subtotal + VAT Tax = Total
 */
export function calculateInvoiceTotals(
  items: InvoiceLineInput[],
  isPriceNet = true
): InvoiceTotals {
  let subtotalSum = 0;
  let taxSum = 0;

  const lines: CalculatedInvoiceLine[] = items.map((item) => {
    let lineNet: number;
    let lineTax: number;

    if (isPriceNet) {
      lineNet = item.quantity * item.unitPrice;
      lineTax = lineNet * (item.vatRate / 100);
    } else {
      // Gross price includes VAT
      const lineTotalGross = item.quantity * item.unitPrice;
      lineNet = lineTotalGross / (1 + item.vatRate / 100);
      lineTax = lineTotalGross - lineNet;
    }

    const roundedNet = Number(lineNet.toFixed(2));
    const roundedTax = Number(lineTax.toFixed(2));
    const lineTotal = Number((roundedNet + roundedTax).toFixed(2));

    subtotalSum += roundedNet;
    taxSum += roundedTax;

    return {
      ...item,
      subtotal: roundedNet,
      taxAmount: roundedTax,
      totalLine: lineTotal,
    };
  });

  const subtotal = Number(subtotalSum.toFixed(2));
  const taxTotal = Number(taxSum.toFixed(2));
  const total = Number((subtotal + taxTotal).toFixed(2));

  return {
    subtotal,
    taxTotal,
    total,
    lines,
  };
}

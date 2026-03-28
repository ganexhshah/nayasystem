import type { Order, Restaurant } from "@/lib/types"
import QRCode from "qrcode"

/**
 * Generates a base64 QR code data URL for a given string.
 */
async function makeQR(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 160,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  })
}

/**
 * Opens a 72mm thermal-style print window.
 * - Logo on the left of the header
 * - Rating QR (links to restaurant public page)
 * - Payment QR if order is unpaid and payment method is upi/online
 * - "Powered by NayaMenu" footer
 */
export async function printReceipt(order: Order, restaurant?: Restaurant | null, paidAmount?: number, changeAmount?: number, existingWin?: Window | null) {
  const r = restaurant
  const items = order.items ?? []
  const payments = order.payments ?? []
  const payMethod = payments[0]?.method ?? ""
  const isPaid = order.payment_status === "paid"
  const isOnlinePayment = ["upi", "online"].includes(payMethod)

  // Open the window FIRST (synchronously) before any awaits — prevents popup blocker
  // If a pre-opened window is passed in, use that instead
  const win = existingWin ?? window.open("", "_blank", "width=360,height=640,toolbar=0,menubar=0,scrollbars=1,resizable=1")
  if (!win) return

  const now = new Date(order.created_at).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })

  // ── QR codes ──────────────────────────────────────────────────────────────
  const appBase = typeof window !== "undefined" ? window.location.origin : ""

  // Rating QR — links to the restaurant's public page
  const ratingUrl = r?.slug ? `${appBase}/restaurant/${r.slug}` : ""
  const ratingQR = ratingUrl ? await makeQR(ratingUrl) : ""

  // Payment QR — from restaurant settings if unpaid + online/upi method
  let paymentQR = ""
  if (!isPaid && isOnlinePayment) {
    const methods = (r?.settings?.payment_methods ?? {}) as Record<string, { qr_image?: string }>
    // try upi first, then any enabled method with a qr_image
    const qrImg =
      methods["esewa"]?.qr_image ||
      methods["khalti"]?.qr_image ||
      methods["fonepay"]?.qr_image ||
      methods["bank"]?.qr_image ||
      ""
    if (qrImg) paymentQR = qrImg
    else if (ratingUrl) {
      // fallback: generate a QR with the total amount as a UPI deep link placeholder
      paymentQR = await makeQR(`upi://pay?am=${Number(order.total).toFixed(2)}&cu=INR&tn=${order.order_number}`)
    }
  }

  // ── Item rows ──────────────────────────────────────────────────────────────
  const itemRows = items.map(i => {
    const total = (Number(i.price) * i.quantity).toFixed(2)
    const name = i.name.length > 20 ? i.name.slice(0, 19) + "…" : i.name
    return `<tr>
      <td style="padding:2px 0;vertical-align:top">${name}</td>
      <td style="text-align:center;padding:2px 4px;vertical-align:top">${i.quantity}</td>
      <td style="text-align:right;padding:2px 0;vertical-align:top;white-space:nowrap">&#8377;${total}</td>
    </tr>`
  }).join("")

  // ── Logo ───────────────────────────────────────────────────────────────────
  const logoHtml = r?.logo
    ? `<img src="${r.logo}" alt="logo" style="height:40px;width:auto;object-fit:contain;display:block;margin:0 auto 4px auto" />`
    : ""

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Receipt ${order.order_number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Courier New',Courier,monospace;
    font-size:11px;
    width:72mm;
    padding:4mm 3mm 6mm;
    color:#000;
    background:#fff;
  }
  .center{text-align:center}
  .bold{font-weight:bold}
  .sm{font-size:10px}
  .lg{font-size:13px}
  .xl{font-size:15px}
  .divider{border:none;border-top:1px dashed #000;margin:4px 0}
  .divider-solid{border:none;border-top:1px solid #000;margin:4px 0}
  table{width:100%;border-collapse:collapse}
  .items th{font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;font-size:10px}
  .totals td{padding:1px 0}
  .totals .val{text-align:right}
  .grand td{font-weight:bold;font-size:13px;border-top:1px solid #000;padding-top:3px}
  .qr-row{display:flex;justify-content:space-around;align-items:flex-start;gap:6px;margin-top:6px}
  .qr-box{text-align:center;flex:1}
  .qr-box img{width:72px;height:72px;display:block;margin:0 auto}
  .qr-box .ql{font-size:9px;margin-top:2px;color:#333}
  .powered{font-size:9px;color:#555;margin-top:6px;text-align:center}
  @media print{
    body{width:72mm}
    @page{size:72mm auto;margin:0}
  }
</style>
</head>
<body>

  <!-- Logo + Restaurant header -->
  ${logoHtml}
  <div class="center bold xl">${r?.name ?? "Restaurant"}</div>
  ${r?.address ? `<div class="center sm">${r.address}${r.city ? ", " + r.city : ""}</div>` : ""}
  ${r?.phone ? `<div class="center sm">Tel: ${r.phone}</div>` : ""}
  ${r?.email ? `<div class="center sm">${r.email}</div>` : ""}

  <hr class="divider-solid"/>

  <!-- Order info -->
  <table>
    <tr><td class="bold">Order#</td><td style="text-align:right">${order.order_number}</td></tr>
    <tr><td class="bold">Date</td><td style="text-align:right">${now}</td></tr>
    <tr><td class="bold">Type</td><td style="text-align:right">${order.order_type.replace("_"," ").toUpperCase()}</td></tr>
    ${order.table?.name ? `<tr><td class="bold">Table</td><td style="text-align:right">${order.table.name}</td></tr>` : ""}
    ${order.customer?.name ? `<tr><td class="bold">Customer</td><td style="text-align:right">${order.customer.name}</td></tr>` : ""}
  </table>

  <hr class="divider"/>

  <!-- Items -->
  <table class="items">
    <thead>
      <tr>
        <th style="text-align:left">Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Amt</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider"/>

  <!-- Totals -->
  <table class="totals">
    <tr><td>Subtotal</td><td class="val">&#8377;${Number(order.subtotal).toFixed(2)}</td></tr>
    ${Number(order.discount) > 0 ? `<tr><td>Discount</td><td class="val">-&#8377;${Number(order.discount).toFixed(2)}</td></tr>` : ""}
    ${Number(order.tax) > 0 ? `<tr><td>Tax</td><td class="val">&#8377;${Number(order.tax).toFixed(2)}</td></tr>` : ""}
    ${Number(order.service_charge) > 0 ? `<tr><td>Service Charge</td><td class="val">&#8377;${Number(order.service_charge).toFixed(2)}</td></tr>` : ""}
  </table>
  <table class="grand">
    <tr><td>TOTAL</td><td style="text-align:right">&#8377;${Number(order.total).toFixed(2)}</td></tr>
  </table>

  <hr class="divider"/>

  <table class="totals">
    ${payMethod ? `<tr><td>Payment</td><td class="val">${payMethod.toUpperCase()}</td></tr>` : ""}
    <tr><td>Status</td><td class="val">${order.payment_status.toUpperCase()}</td></tr>
    ${paidAmount != null ? `<tr><td>Paid</td><td class="val">&#8377;${Number(paidAmount).toFixed(2)}</td></tr>` : ""}
    ${changeAmount != null && changeAmount > 0 ? `<tr class="bold" style="font-size:12px"><td>Change</td><td class="val">&#8377;${Number(changeAmount).toFixed(2)}</td></tr>` : ""}
  </table>

  <hr class="divider-solid"/>

  <!-- QR codes row -->
  ${(ratingQR || paymentQR) ? `
  <div class="qr-row">
    ${ratingQR ? `
    <div class="qr-box">
      <img src="${ratingQR}" alt="Rate us"/>
      <div class="ql">Scan to Rate Us</div>
    </div>` : ""}
    ${paymentQR ? `
    <div class="qr-box">
      <img src="${paymentQR}" alt="Pay"/>
      <div class="ql">Scan to Pay</div>
    </div>` : ""}
  </div>
  <hr class="divider"/>` : ""}

  <!-- Footer -->
  <div class="center sm" style="margin-top:4px">
    <div class="bold">Thank you for visiting!</div>
    ${r?.name ? `<div>${r.name}</div>` : ""}
    <div style="margin-top:3px">*** Customer Copy ***</div>
  </div>

  <div class="powered">Powered by NayaMenu System</div>

</body>
</html>`

  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.close()
  }, 400)
}

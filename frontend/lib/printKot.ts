import type { Kot, Order } from "@/lib/types"

/**
 * Prints a single KOT slip in kitchen-ticket style (80mm thermal).
 * Large, bold text — easy to read across a busy kitchen.
 */
export function printKot(kot: Kot, order: Order) {
  const items = order.items ?? []
  const now = new Date(kot.created_at).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:4px 0;font-size:15px;font-weight:bold">${i.name}</td>
      <td style="text-align:right;padding:4px 0;font-size:20px;font-weight:900;white-space:nowrap">× ${i.quantity}</td>
    </tr>
    ${i.notes ? `<tr><td colspan="2" style="font-size:11px;color:#555;padding-bottom:4px;padding-left:4px">↳ ${i.notes}</td></tr>` : ""}
  `).join("")

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>KOT ${kot.kot_number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Courier New',Courier,monospace;
    font-size:13px;
    width:72mm;
    padding:4mm 3mm;
    color:#000;
    background:#fff;
  }
  .center{text-align:center}
  .bold{font-weight:bold}
  .divider{border:none;border-top:2px dashed #000;margin:6px 0}
  .divider-solid{border:none;border-top:2px solid #000;margin:6px 0}
  table{width:100%;border-collapse:collapse}
  @media print{
    body{width:72mm}
    @page{size:72mm auto;margin:0}
  }
</style>
</head>
<body>

  <div class="center bold" style="font-size:22px;letter-spacing:2px">KOT</div>
  <div class="center bold" style="font-size:16px;margin-top:2px">${kot.kot_number}</div>

  <hr class="divider-solid"/>

  <table>
    <tr>
      <td class="bold">Order#</td>
      <td style="text-align:right">${order.order_number}</td>
    </tr>
    <tr>
      <td class="bold">Time</td>
      <td style="text-align:right">${now}</td>
    </tr>
    ${order.table?.name ? `<tr><td class="bold">Table</td><td style="text-align:right;font-size:16px;font-weight:bold">${order.table.name}</td></tr>` : ""}
    ${order.order_type ? `<tr><td class="bold">Type</td><td style="text-align:right">${order.order_type.replace("_"," ").toUpperCase()}</td></tr>` : ""}
  </table>

  <hr class="divider"/>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;font-size:11px;border-bottom:1px solid #000;padding-bottom:3px">ITEM</th>
        <th style="text-align:right;font-size:11px;border-bottom:1px solid #000;padding-bottom:3px">QTY</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider"/>

  ${kot.notes ? `<div style="font-size:12px;margin-bottom:4px"><span class="bold">Note:</span> ${kot.notes}</div><hr class="divider"/>` : ""}

  <div class="center" style="font-size:11px;margin-top:4px">*** Kitchen Copy ***</div>

</body>
</html>`

  const win = window.open("", "_blank", "width=340,height=500,toolbar=0,menubar=0,scrollbars=1")
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

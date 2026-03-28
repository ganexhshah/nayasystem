<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $order->order_number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 20px; margin: 0; }
        .header p { margin: 2px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background: #f5f5f5; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 10px; }
        .totals td { border: none; }
        .totals .label { text-align: right; font-weight: bold; }
        .totals .total-row td { font-size: 14px; font-weight: bold; border-top: 2px solid #333; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        @if($restaurant->logo)
            <img src="{{ $restaurant->logo }}" height="50" alt="Logo">
        @endif
        <h1>{{ $restaurant->name }}</h1>
        <p>{{ $restaurant->address }}</p>
        <p>{{ $restaurant->phone }} | {{ $restaurant->email }}</p>
    </div>

    <hr>
    <table>
        <tr>
            <td><strong>Invoice #:</strong> {{ $order->order_number }}</td>
            <td><strong>Date:</strong> {{ $order->created_at->format('d M Y, h:i A') }}</td>
        </tr>
        <tr>
            <td><strong>Type:</strong> {{ ucfirst(str_replace('_', ' ', $order->order_type)) }}</td>
            <td><strong>Table:</strong> {{ $order->table?->name ?? 'N/A' }}</td>
        </tr>
        @if($order->customer)
        <tr>
            <td colspan="2"><strong>Customer:</strong> {{ $order->customer->name }} | {{ $order->customer->phone }}</td>
        </tr>
        @endif
    </table>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>
                    {{ $item->name }}
                    @if($item->modifiers)
                        <br><small style="color:#666">
                            {{ collect($item->modifiers)->pluck('name')->join(', ') }}
                        </small>
                    @endif
                </td>
                <td>{{ $item->quantity }}</td>
                <td>{{ $restaurant->currency }} {{ number_format($item->price, 2) }}</td>
                <td>{{ $restaurant->currency }} {{ number_format($item->price * $item->quantity, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="label">Subtotal:</td>
            <td>{{ $restaurant->currency }} {{ number_format($order->subtotal, 2) }}</td>
        </tr>
        @if($order->tax > 0)
        <tr>
            <td class="label">Tax:</td>
            <td>{{ $restaurant->currency }} {{ number_format($order->tax, 2) }}</td>
        </tr>
        @endif
        @if($order->service_charge > 0)
        <tr>
            <td class="label">Service Charge:</td>
            <td>{{ $restaurant->currency }} {{ number_format($order->service_charge, 2) }}</td>
        </tr>
        @endif
        @if($order->discount > 0)
        <tr>
            <td class="label">Discount:</td>
            <td>- {{ $restaurant->currency }} {{ number_format($order->discount, 2) }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td class="label">TOTAL:</td>
            <td>{{ $restaurant->currency }} {{ number_format($order->total, 2) }}</td>
        </tr>
    </table>

    <div class="footer">
        <p>Thank you for dining with us!</p>
        <p>Powered by Naya System</p>
    </div>
</body>
</html>

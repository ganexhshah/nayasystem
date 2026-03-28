<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public Restaurant $restaurant,
        public ?string $pdfBinary = null,
        public ?string $filename = null
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invoice '.$this->order->order_number.' from '.$this->restaurant->name
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.orders.invoice-ready'
        );
    }

    public function attachments(): array
    {
        if (!$this->pdfBinary) {
            return [];
        }

        return [
            Attachment::fromData(
                fn () => $this->pdfBinary,
                $this->filename ?: ('invoice-'.$this->order->order_number.'.pdf')
            )->withMime('application/pdf'),
        ];
    }
}


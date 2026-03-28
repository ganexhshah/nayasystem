<?php

namespace App\Services;

use App\Mail\DemoRequestAcceptedMail;
use App\Mail\OrderInvoiceMail;
use App\Mail\SystemNotificationMail;
use App\Models\DemoRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\SupportTicket;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;

class BusinessMailService
{
    public function sendStaffWelcome(User $staff, Restaurant $restaurant, string $role): void
    {
        $this->sendToSingle(
            $staff->email,
            new SystemNotificationMail(
                subjectLine: 'Welcome to '.$restaurant->name.' team',
                title: 'Staff Account Created',
                greeting: 'Hi '.$staff->name.',',
                lines: [
                    'Your staff account has been created.',
                    'Restaurant: '.$restaurant->name,
                    'Role: '.str_replace('_', ' ', $role),
                    'You can now sign in and start using the system.',
                ],
                actionText: 'Sign In',
                actionUrl: $this->frontendUrl('/auth/login')
            )
        );
    }

    public function sendStaffRoleUpdated(User $staff, Restaurant $restaurant, string $role): void
    {
        $this->sendToSingle(
            $staff->email,
            new SystemNotificationMail(
                subjectLine: 'Role updated at '.$restaurant->name,
                title: 'Role Updated',
                greeting: 'Hi '.$staff->name.',',
                lines: [
                    'Your access role has been updated.',
                    'Restaurant: '.$restaurant->name,
                    'New role: '.str_replace('_', ' ', $role),
                ],
                actionText: 'Open Dashboard',
                actionUrl: $this->frontendUrl('/app/dashboard')
            )
        );
    }

    public function sendBranchAdded(Restaurant $restaurant, string $branchName): void
    {
        $mail = new SystemNotificationMail(
            subjectLine: 'New branch added: '.$branchName,
            title: 'Branch Added',
            greeting: 'Hello '.$restaurant->name.' Team,',
            lines: [
                'A new branch configuration was added.',
                'Branch: '.$branchName,
            ],
            actionText: 'Open Settings',
            actionUrl: $this->frontendUrl('/app/settings')
        );

        $this->sendToMany($this->restaurantRecipients($restaurant), $mail);
    }

    public function sendSubscriptionUpdate(Subscription $subscription, string $event, ?string $extra = null): void
    {
        $subscription->loadMissing(['restaurant', 'plan']);
        $restaurant = $subscription->restaurant;
        if (!$restaurant) {
            return;
        }

        $planName = $subscription->plan?->name ?? 'plan';
        $lines = [
            'Subscription event: '.$event,
            'Plan: '.$planName,
            'Status: '.$subscription->status,
            'Billing cycle: '.$subscription->billing_cycle,
            'Amount: '.number_format((float) $subscription->amount, 2).' '.$subscription->currency,
        ];

        if ($subscription->expires_at) {
            $lines[] = 'Expires: '.$subscription->expires_at->toDateString();
        }
        if ($extra) {
            $lines[] = $extra;
        }

        $mail = new SystemNotificationMail(
            subjectLine: 'Subscription '.$event.' - '.$restaurant->name,
            title: 'Subscription Update',
            greeting: 'Hello '.$restaurant->name.' Team,',
            lines: $lines,
            actionText: 'View Subscription',
            actionUrl: $this->frontendUrl('/app/subscription')
        );

        $this->sendToMany($this->restaurantRecipients($restaurant), $mail);
    }

    public function sendInvoiceGenerated(Order $order, Restaurant $restaurant, ?string $pdfBinary = null, ?string $filename = null): void
    {
        $order->loadMissing(['customer']);
        $customerEmail = $order->customer?->email;
        $recipients = $this->restaurantRecipients($restaurant);
        if ($customerEmail) {
            $recipients[] = $customerEmail;
        }

        foreach (array_unique(array_filter($recipients)) as $email) {
            $this->sendToSingle($email, new OrderInvoiceMail($order, $restaurant, $pdfBinary, $filename));
        }
    }

    public function sendPaymentReceived(Payment $payment, Order $order, Restaurant $restaurant): void
    {
        $order->loadMissing('customer');
        $customerEmail = $order->customer?->email;
        if (!$customerEmail) {
            return;
        }

        $this->sendToSingle(
            $customerEmail,
            new SystemNotificationMail(
                subjectLine: 'Payment received for '.$order->order_number,
                title: 'Payment Confirmation',
                greeting: 'Hello,',
                lines: [
                    'Restaurant: '.$restaurant->name,
                    'Order: '.$order->order_number,
                    'Amount paid: '.number_format((float) $payment->amount, 2),
                    'Method: '.$payment->method,
                    'Status: '.$payment->status,
                ]
            )
        );
    }

    public function sendDuePaymentReminder(Order $order, Restaurant $restaurant): void
    {
        $order->loadMissing('customer');
        $customerEmail = $order->customer?->email;
        if (!$customerEmail) {
            return;
        }

        $this->sendToSingle(
            $customerEmail,
            new SystemNotificationMail(
                subjectLine: 'Payment reminder for '.$order->order_number,
                title: 'Pending Payment Reminder',
                greeting: 'Hello,',
                lines: [
                    'Order '.$order->order_number.' has a pending payment.',
                    'Restaurant: '.$restaurant->name,
                    'Amount due: '.number_format((float) $order->total, 2),
                ]
            )
        );
    }

    public function sendWeeklySummary(Restaurant $restaurant, array $metrics): void
    {
        $mail = new SystemNotificationMail(
            subjectLine: 'Weekly update - '.$restaurant->name,
            title: 'Weekly Business Summary',
            greeting: 'Hello '.$restaurant->name.' Team,',
            lines: [
                'Orders this week: '.($metrics['orders'] ?? 0),
                'Revenue this week: '.number_format((float) ($metrics['revenue'] ?? 0), 2),
                'Unpaid completed orders: '.($metrics['due_orders'] ?? 0),
            ],
            actionText: 'Open Reports',
            actionUrl: $this->frontendUrl('/app/reports/sales')
        );

        $this->sendToMany($this->restaurantRecipients($restaurant), $mail);
    }

    public function sendMonthlySummary(Restaurant $restaurant, array $metrics): void
    {
        $mail = new SystemNotificationMail(
            subjectLine: 'Monthly update - '.$restaurant->name,
            title: 'Monthly Business Summary',
            greeting: 'Hello '.$restaurant->name.' Team,',
            lines: [
                'Orders this month: '.($metrics['orders'] ?? 0),
                'Revenue this month: '.number_format((float) ($metrics['revenue'] ?? 0), 2),
                'Average order value: '.number_format((float) ($metrics['avg_order_value'] ?? 0), 2),
                'Unpaid completed orders: '.($metrics['due_orders'] ?? 0),
            ],
            actionText: 'Open Dashboard',
            actionUrl: $this->frontendUrl('/app/dashboard')
        );

        $this->sendToMany($this->restaurantRecipients($restaurant), $mail);
    }

    public function sendIssueAlert(Restaurant $restaurant, string $subject, string $description): void
    {
        $mail = new SystemNotificationMail(
            subjectLine: $subject,
            title: 'Important Update',
            greeting: 'Hello '.$restaurant->name.' Team,',
            lines: [$description],
            actionText: 'Open Settings',
            actionUrl: $this->frontendUrl('/app/settings')
        );

        $this->sendToMany($this->restaurantRecipients($restaurant), $mail);
    }

    public function sendDemoRequestAccepted(DemoRequest $demoRequest): void
    {
        $this->sendToSingle(
            $demoRequest->email,
            new DemoRequestAcceptedMail($demoRequest)
        );
    }

    public function sendSupportTicketCreatedToSupport(SupportTicket $ticket): void
    {
        $ticket->loadMissing(['restaurant', 'user']);

        $this->sendToSingle(
            $this->supportEmail(),
            new SystemNotificationMail(
                subjectLine: 'New support ticket: '.$ticket->subject,
                title: 'New Support Ticket',
                greeting: 'Hello Support Team,',
                lines: [
                    'Restaurant: '.($ticket->restaurant?->name ?? 'Unknown'),
                    'Requester: '.($ticket->user?->name ?? 'Unknown'),
                    'Email: '.($ticket->user?->email ?? $ticket->restaurant?->email ?? 'N/A'),
                    'Category: '.$ticket->category,
                    'Priority: '.$ticket->priority,
                    'Message: '.$ticket->message,
                ],
                actionText: 'Open Support Management',
                actionUrl: $this->frontendUrl('/admin/support-management')
            )
        );
    }

    public function sendSupportTicketReplyToRestaurant(SupportTicket $ticket, string $replyMessage): void
    {
        $ticket->loadMissing(['restaurant', 'user']);

        $recipient = $ticket->user?->email ?: $ticket->restaurant?->email;
        if (!$recipient) {
            return;
        }

        $this->sendToSingle(
            $recipient,
            new SystemNotificationMail(
                subjectLine: 'Support update: '.$ticket->subject,
                title: 'Support Ticket Update',
                greeting: 'Hi '.($ticket->user?->name ?? $ticket->restaurant?->name ?? 'there').',',
                lines: [
                    'Your support ticket has a new reply from the NayaSystem team.',
                    'Subject: '.$ticket->subject,
                    'Current status: '.$ticket->status,
                    'Reply: '.$replyMessage,
                ],
                actionText: 'Open Support Tickets',
                actionUrl: $this->frontendUrl('/app/support')
            )
        );
    }

    /**
     * @return array<int, string>
     */
    private function restaurantRecipients(Restaurant $restaurant): array
    {
        $ownerEmails = User::query()
            ->where('restaurant_id', $restaurant->id)
            ->role('owner')
            ->pluck('email')
            ->all();

        $emails = array_merge($ownerEmails, [$restaurant->email]);

        return array_values(array_unique(array_filter($emails)));
    }

    private function sendToMany(array $emails, SystemNotificationMail $mail): void
    {
        foreach ($emails as $email) {
            $this->sendToSingle($email, clone $mail);
        }
    }

    private function sendToSingle(?string $email, mixed $mailable): void
    {
        if (!$email) {
            return;
        }

        try {
            Mail::to($email)->send($mailable);
        } catch (\Throwable $e) {
            Log::warning('Business mail send failed', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function frontendUrl(string $path): string
    {
        return rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/').$path;
    }

    private function supportEmail(): string
    {
        $settings = Cache::get('admin_platform_settings', [
            'support_email' => 'support@nayasystem.com',
        ]);

        return (string) ($settings['support_email'] ?? 'support@nayasystem.com');
    }
}

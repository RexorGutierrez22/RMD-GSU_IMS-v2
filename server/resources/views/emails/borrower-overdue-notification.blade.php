<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overdue Item Reminder</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .alert-box {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .item-details {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
        }
        .detail-value {
            color: #1f2937;
        }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-danger {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .action-button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .action-button:hover {
            background-color: #b91c1c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Overdue Item Reminder</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">USeP RMD Inventory Management System</p>
        </div>

        <p>Hello <strong>{{ $transaction->borrower_name }}</strong>,</p>

        <div class="alert-box">
            <strong>⚠️ Important:</strong> You have an overdue borrowed item that needs to be returned immediately.
        </div>

        <div class="item-details">
            <h2 style="margin-top: 0; color: #1f2937;">Borrowed Item Details</h2>

            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value"><strong>{{ $transaction->transaction_id }}</strong></span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Item Name:</span>
                <span class="detail-value">{{ $transaction->inventoryItem->name ?? 'N/A' }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">{{ $transaction->inventoryItem->category ?? 'N/A' }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">{{ $transaction->quantity }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Borrow Date:</span>
                <span class="detail-value">{{ $transaction->borrow_date->format('F d, Y') }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Expected Return Date:</span>
                <span class="detail-value">{{ $transaction->expected_return_date->format('F d, Y') }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Days Overdue:</span>
                <span class="detail-value">
                    <span class="badge badge-danger">{{ $daysOverdue }} day(s)</span>
                </span>
            </div>

            @if($transaction->purpose)
            <div class="detail-row">
                <span class="detail-label">Purpose:</span>
                <span class="detail-value">{{ $transaction->purpose }}</span>
            </div>
            @endif
        </div>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>📋 Action Required:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please return the borrowed item(s) as soon as possible</li>
                <li>Contact the Resource Management Division if you need to extend the return date</li>
                <li>Return the item(s) in good condition</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
                If you have already returned this item, please contact the RMD office to update your record.
            </p>
        </div>

        <div class="footer">
            <p><strong>University of Southeastern Philippines</strong></p>
            <p>Resource Management Division</p>
            <p style="margin-top: 10px; color: #9ca3af;">
                This is an automated reminder. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>


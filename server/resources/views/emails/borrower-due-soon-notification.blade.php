<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Item Due Tomorrow Reminder</title>
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
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
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
        .badge-warning {
            background-color: #fef3c7;
            color: #92400e;
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
            background-color: #f59e0b;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .action-button:hover {
            background-color: #d97706;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Item Due Tomorrow Reminder</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">USeP RMD Inventory Management System</p>
        </div>

        <p>Hello <strong>{{ $transaction->borrower_name }}</strong>,</p>

        <div class="alert-box">
            <strong>📅 Friendly Reminder:</strong> Your borrowed item is due for return <strong>tomorrow</strong>. Please prepare to return it on time.
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
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">
                    <strong style="color: #f59e0b;">{{ $transaction->expected_return_date->format('F d, Y') }}</strong>
                    <span class="badge badge-warning">Due Tomorrow</span>
                </span>
            </div>

            @if($transaction->purpose)
            <div class="detail-row">
                <span class="detail-label">Purpose:</span>
                <span class="detail-value">{{ $transaction->purpose }}</span>
            </div>
            @endif
        </div>

        <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>📋 Reminder:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please prepare to return the borrowed item(s) tomorrow</li>
                <li>Ensure the item(s) are in good condition</li>
                <li>Contact the Resource Management Division if you need to extend the return date</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
                Thank you for your cooperation in maintaining our inventory management system.
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


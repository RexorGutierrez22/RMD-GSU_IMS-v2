<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overdue Items Alert</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
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
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }
        .stat-number {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }
        th {
            background-color: #1f2937;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        tr:hover {
            background-color: #f3f4f6;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
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
            <h1>⚠️ Overdue Items Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Resource Management Division - Inventory Management System</p>
        </div>

        <div class="alert-box">
            <strong>⚠️ Action Required:</strong> There are currently <strong>{{ $totalCount }}</strong> overdue transaction(s) that require your attention.
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">{{ $totalCount }}</div>
                <div class="stat-label">Overdue Transactions</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ $totalItems }}</div>
                <div class="stat-label">Total Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ $totalDaysOverdue }}</div>
                <div class="stat-label">Avg Days Overdue</div>
            </div>
        </div>

        <h2 style="color: #1f2937; margin-top: 30px;">Overdue Items Details</h2>

        <table>
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>Borrower</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                </tr>
            </thead>
            <tbody>
                @foreach($overdueItems as $item)
                <tr>
                    <td><strong>{{ $item['transaction_id'] }}</strong></td>
                    <td>
                        {{ $item['borrower_name'] }}<br>
                        <small style="color: #6b7280;">{{ $item['borrower_email'] }}</small>
                    </td>
                    <td>
                        {{ $item['item_name'] }}<br>
                        <small style="color: #6b7280;">{{ $item['item_category'] }}</small>
                    </td>
                    <td>{{ $item['quantity'] }}</td>
                    <td>{{ $item['expected_return_date'] }}</td>
                    <td>
                        <span class="badge badge-danger">{{ $item['days_overdue'] }} day(s)</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url', 'http://localhost:3010') }}/dashboard" class="action-button">View Dashboard</a>
        </div>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>📋 Recommended Actions:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Contact borrowers to remind them about overdue items</li>
                <li>Review overdue items in the dashboard</li>
                <li>Consider extending return dates if needed</li>
                <li>Update inventory records accordingly</li>
            </ul>
        </div>

        <div class="footer">
            <p><strong>Report Generated:</strong> {{ $reportDate }}</p>
            <p>This is an automated notification from <strong>RMD - RMMS</strong></p>
            <p style="margin-top: 10px; color: #9ca3af;">
                University of Southeastern Philippines<br>
                Resource Management Division
            </p>
        </div>
    </div>
</body>
</html>


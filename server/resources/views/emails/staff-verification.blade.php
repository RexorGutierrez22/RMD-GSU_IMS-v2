<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - USeP RMD IMS</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #8B0000 0%, #A52A2A 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .verification-code {
            background: linear-gradient(135deg, #8B0000 0%, #A52A2A 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 30px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
        }
        .info-section {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Email Verification Required</h1>
        </div>

        <p>Hello <strong>{{ $registration->full_name }}</strong>,</p>

        <p>Thank you for registering for Admin/Staff access to the USeP Resource Management Division Inventory Management System.</p>

        <p>To complete your registration and verify the legitimacy of your email address, please enter the email authentication code below:</p>

        <div class="verification-code">
            {{ $verificationCode }}
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This email authentication code will expire in 15 minutes</li>
                <li>You have 5 attempts to enter the correct code</li>
                <li>Do not share this code with anyone</li>
                <li>This code verifies the authenticity and legitimacy of your email address</li>
            </ul>
        </div>

        <div class="info-section">
            <h3 style="margin-top: 0; color: #8B0000;">Your Registration Information</h3>
            <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span class="info-value">{{ $registration->full_name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ $registration->email }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Username:</span>
                <span class="info-value">{{ $registration->username }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Department:</span>
                <span class="info-value">{{ $registration->department }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Position:</span>
                <span class="info-value">{{ $registration->position }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Requested Role:</span>
                <span class="info-value">{{ ucfirst($registration->requested_role) }}</span>
            </div>
        </div>

        <p>After verification, your registration will be submitted to the Super Admin for approval.</p>

        <p>If you did not register for this account, please ignore this email.</p>

        <div class="footer">
            <p>This is an automated message from USeP Resource Management Division Inventory Management System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>


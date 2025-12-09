<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Successful - USeP RMD IMS</title>
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
        .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
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
            color: #8B0000;
        }
        .credentials-section {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials-section h3 {
            color: #856404;
            margin-top: 0;
        }
        .credential-item {
            background-color: #fff;
            padding: 12px;
            margin: 8px 0;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
        }
        .credential-label {
            font-weight: bold;
            color: #856404;
            display: block;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 16px;
            color: #333;
            font-family: 'Courier New', monospace;
        }
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #fff;
            border: 2px dashed #8B0000;
            border-radius: 8px;
        }
        .qr-code {
            max-width: 250px;
            margin: 20px auto;
            display: block;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #8B0000;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .button:hover {
            background-color: #A52A2A;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Registration Successful!</h1>
        </div>

        <div class="success-icon">
            ✅
        </div>

        <p style="text-align: center; font-size: 18px; color: #8B0000; font-weight: bold;">
            Welcome to USeP RMD Inventory Management System!
        </p>

        <p>Dear <strong>{{ $employee->first_name }} {{ $employee->last_name }}</strong>,</p>

        <p>Your registration has been successfully completed! Your account has been created and your unique QR code has been generated.</p>

        <div class="credentials-section">
            <h3>🔑 Your Login Credentials</h3>
            <p style="margin-bottom: 15px; color: #856404;">Please save these credentials. You will need them to access the system:</p>
            <div class="credential-item">
                <span class="credential-label">Employee ID:</span>
                <span class="credential-value">{{ $employee->emp_id }}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Email Address:</span>
                <span class="credential-value">{{ $employee->email }}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Contact Number:</span>
                <span class="credential-value">{{ $employee->contact_number }}</span>
            </div>
            <p style="margin-top: 15px; font-size: 13px; color: #856404;">
                <strong>Note:</strong> You can use your Employee ID, Email, or Contact Number along with your Contact Number to authenticate and access the system.
            </p>
        </div>

        <div class="info-section">
            <h3 style="color: #8B0000; margin-top: 0;">Your Registration Information:</h3>
            <div class="info-row">
                <span class="info-label">Employee ID:</span>
                <span>{{ $employee->emp_id }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span>{{ $employee->first_name }} {{ $employee->middle_name ? $employee->middle_name . ' ' : '' }}{{ $employee->last_name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span>{{ $employee->email }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Position:</span>
                <span>{{ $employee->position }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Department:</span>
                <span>{{ $employee->department }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Contact Number:</span>
                <span>{{ $employee->contact_number }}</span>
            </div>
        </div>

        <div class="qr-section">
            <h3 style="color: #8B0000; margin-top: 0;">Your Unique QR Code</h3>
            <p style="margin-bottom: 20px;">Please save this QR code. You will need it to borrow and return items from the inventory system.</p>

            @if($qrCodeBase64)
                <img src="{{ $qrCodeBase64 }}" alt="QR Code" class="qr-code">
            @else
                <p style="color: #999;">QR Code image not available</p>
            @endif

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                <strong>Important:</strong> Keep this QR code safe. You can use it to access inventory services.
                <br><strong>If you lose your QR code, you can retrieve it from this email anytime!</strong>
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $qrDownloadUrl }}" class="button">Download QR Code</a>
        </div>

        <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #0c5460;">
                <strong>💡 Tip:</strong> Save this email in a safe place. You can always refer back to it to retrieve your QR code and credentials if needed.
            </p>
        </div>

        <div class="footer">
            <p><strong>USeP RMD Inventory Management System</strong></p>
            <p>University of Southeastern Philippines</p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                If you did not register for this account, please contact the system administrator immediately.
            </p>
        </div>
    </div>
</body>
</html>


import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailVerificationModal = ({
	isOpen,
	onClose,
	onVerificationSuccess,
	userId,
	email,
	userType = 'student' // 'student' or 'employee'
}) => {
	const [verificationCode, setVerificationCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [error, setError] = useState('');
	const [remainingAttempts, setRemainingAttempts] = useState(5);
	const [codeExpired, setCodeExpired] = useState(false);
	const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
	const [countdown, setCountdown] = useState(0);

	// Countdown timer for resend button
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setVerificationCode('');
			setError('');
			setRemainingAttempts(5);
			setCodeExpired(false);
			setMaxAttemptsReached(false);
			setCountdown(0);
		}
	}, [isOpen]);

	const handleCodeChange = (e) => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 6);
		setVerificationCode(value);
		setError('');
	};

	const handleVerify = async () => {
		if (verificationCode.length !== 6) {
			setError('Please enter a 6-digit verification code');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const endpoint = userType === 'student'
				? 'http://localhost:8000/api/students/verify-email'
				: 'http://localhost:8000/api/employees/verify-email';

			const response = await axios.post(endpoint, {
				[userType === 'student' ? 'student_id' : 'employee_id']: userId,
				verification_code: verificationCode
			});

			if (response.data.success) {
				// Verification successful - show QR modal
				onVerificationSuccess(response.data);
			}
		} catch (err) {
			const errorData = err.response?.data || {};

			if (errorData.max_attempts_reached) {
				setMaxAttemptsReached(true);
				setError('Maximum verification attempts reached. Registration has been cancelled. Please register again.');
				setTimeout(() => {
					onClose();
					window.location.reload();
				}, 3000);
			} else if (errorData.code_expired) {
				setCodeExpired(true);
				setError('Verification code has expired. Please request a new code.');
			} else if (errorData.remaining_attempts !== undefined) {
				setRemainingAttempts(errorData.remaining_attempts);
				setError(errorData.message || 'Invalid verification code. Please try again.');
			} else {
				setError(errorData.message || 'Verification failed. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleResendCode = async () => {
		if (countdown > 0) return;

		setResending(true);
		setError('');
		setCodeExpired(false);

		try {
			const endpoint = userType === 'student'
				? 'http://localhost:8000/api/students/resend-verification'
				: 'http://localhost:8000/api/employees/resend-verification';

			const response = await axios.post(endpoint, {
				[userType === 'student' ? 'student_id' : 'employee_id']: userId
			});

			if (response.data.success) {
				setError('');
				setRemainingAttempts(5);
				setCountdown(60); // 60 second cooldown
				alert('Verification code has been resent to your email.');
			}
		} catch (err) {
			const errorData = err.response?.data || {};
			setError(errorData.message || 'Failed to resend verification code. Please try again.');
		} finally {
			setResending(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
					disabled={loading}
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				{/* Header */}
				<div className="text-center mb-6">
					<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
						<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
					<p className="text-gray-600 text-sm">
						We've sent a 6-digit verification code to
					</p>
					<p className="text-gray-900 font-semibold mt-1">{email}</p>
				</div>

				{/* Error message */}
				{error && (
					<div className={`mb-4 p-3 rounded-lg ${
						maxAttemptsReached
							? 'bg-red-50 border border-red-200 text-red-800'
							: codeExpired
							? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
							: 'bg-red-50 border border-red-200 text-red-800'
					}`}>
						<p className="text-sm font-medium">{error}</p>
					</div>
				)}

				{/* Verification code input */}
				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Enter Verification Code
					</label>
					<input
						type="text"
						value={verificationCode}
						onChange={handleCodeChange}
						placeholder="000000"
						maxLength={6}
						disabled={loading || maxAttemptsReached}
						className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
						autoFocus
					/>
					<p className="text-xs text-gray-500 mt-2 text-center">
						{remainingAttempts > 0 ? (
							<span>You have <strong>{remainingAttempts}</strong> attempt(s) remaining</span>
						) : (
							<span className="text-red-600">No attempts remaining</span>
						)}
					</p>
				</div>

				{/* Verify button */}
				<button
					onClick={handleVerify}
					disabled={loading || verificationCode.length !== 6 || maxAttemptsReached}
					className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-3"
				>
					{loading ? (
						<span className="flex items-center justify-center">
							<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Verifying...
						</span>
					) : (
						'Verify Email'
					)}
				</button>

				{/* Resend code button */}
				<div className="text-center">
					<p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
					<button
						onClick={handleResendCode}
						disabled={resending || countdown > 0 || maxAttemptsReached}
						className="text-red-600 hover:text-red-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
					>
						{resending ? (
							'Resending...'
						) : countdown > 0 ? (
							`Resend code in ${countdown}s`
						) : (
							'Resend Verification Code'
						)}
					</button>
				</div>

				{/* Info box */}
				<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<p className="text-xs text-blue-800">
						<strong>Note:</strong> The verification code will expire in 15 minutes.
						Make sure to check your spam folder if you don't see the email.
					</p>
				</div>
			</div>
		</div>
	);
};

export default EmailVerificationModal;


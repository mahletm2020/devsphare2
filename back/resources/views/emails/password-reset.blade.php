@extends('emails.layout')

@section('content')
    <h2>Reset Your Password</h2>
    <p>Hello {{ $user->name }},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="{{ $resetUrl }}" class="button">Reset Password</a>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">{{ $resetUrl }}</p>
    <p>This link will expire in 60 minutes.</p>
    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
@endsection





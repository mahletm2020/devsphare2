@extends('emails.layout')

@section('content')
    <h2>Verify Your Email Address</h2>
    <p>Hello {{ $user->name }},</p>
    <p>Thank you for registering with DevSphere! Please verify your email address by clicking the button below:</p>
    <a href="{{ $verificationUrl }}" class="button">Verify Email Address</a>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">{{ $verificationUrl }}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
@endsection





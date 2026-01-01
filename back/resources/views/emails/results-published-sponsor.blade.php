@extends('emails.layout')

@section('content')
    <h2>Results Published!</h2>
    <p>Hello {{ $sponsor->name }},</p>
    <p>The results for <strong>{{ $hackathon->title }}</strong> have been published!</p>
    <p>Check out the winners and see the impact of your sponsorship.</p>
    <a href="{{ $hackathonUrl }}" class="button">View Results</a>
    <p>Thank you for your support!</p>
@endsection





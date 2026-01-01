@extends('emails.layout')

@section('content')
    <h2>Judging Period Started</h2>
    <p>Hello {{ $judge->name }},</p>
    <p>The judging period for <strong>{{ $hackathon->title }}</strong> has started.</p>
    <p>Please review and rate the assigned submissions before the deadline: {{ $hackathon->judging_deadline->format('F d, Y H:i') }}.</p>
    <a href="{{ $hackathonUrl }}" class="button">Start Judging</a>
    <p>Thank you for your participation!</p>
@endsection





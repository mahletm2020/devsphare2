@extends('emails.layout')

@section('content')
    <h2>Judging Deadline Reminder</h2>
    <p>Hello {{ $judge->name }},</p>
    <p>This is a reminder that the judging deadline for <strong>{{ $hackathon->title }}</strong> is approaching.</p>
    <p><strong>Deadline:</strong> {{ $hackathon->judging_deadline->format('F d, Y H:i') }}</p>
    <p>Please complete your ratings before the deadline.</p>
    <a href="{{ $hackathonUrl }}" class="button">Complete Judging</a>
    <p>Thank you!</p>
@endsection





@extends('emails.layout')

@section('content')
    <h2>Submission Submitted Successfully!</h2>
    <p>Hello {{ $team->leader->name }},</p>
    <p>Your submission <strong>{{ $submission->title }}</strong> has been successfully submitted for the hackathon <strong>{{ $hackathon->title }}</strong>.</p>
    <p>Your team's work is now under review. We'll notify you once the judging period begins.</p>
    <a href="{{ $submissionUrl }}" class="button">View Submission</a>
    <p>Thank you for participating!</p>
@endsection





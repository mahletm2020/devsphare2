@extends('emails.layout')

@section('content')
    <h2>You've Been Assigned as a Judge</h2>
    <p>Hello {{ $judge->name }},</p>
    <p>You have been assigned as a judge for the hackathon <strong>{{ $hackathon->title }}</strong>.</p>
    <p>Please review the submissions and provide your ratings before the judging deadline.</p>
    <a href="{{ $hackathonUrl }}" class="button">View Hackathon</a>
    <p>Thank you for your participation!</p>
@endsection





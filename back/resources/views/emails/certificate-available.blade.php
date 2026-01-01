@extends('emails.layout')

@section('content')
    <h2>Your Certificate is Available!</h2>
    <p>Hello {{ $user->name }},</p>
    <p>Congratulations! Your certificate for <strong>{{ $hackathon->title }}</strong> is now available.</p>
    <p>Certificate Number: <strong>{{ $certificate->certificate_number }}</strong></p>
    @if($certificate->winner_position)
        <p>Position: <strong>{{ $certificate->winner_position }}{{ $certificate->winner_position == 1 ? 'st' : ($certificate->winner_position == 2 ? 'nd' : 'rd') }} Place</strong></p>
    @endif
    <a href="{{ $certificateUrl }}" class="button">View Certificate</a>
    <p>Thank you for participating!</p>
@endsection





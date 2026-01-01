@extends('emails.layout')

@section('content')
    <h2>Hackathon Published Successfully!</h2>
    <p>Hello {{ $hackathon->creator->name }},</p>
    <p>Your hackathon <strong>{{ $hackathon->title }}</strong> has been successfully published and is now live!</p>
    <p>Participants can now register and form teams. You can manage your hackathon from your organizer dashboard.</p>
    <a href="{{ $hackathonUrl }}" class="button">View Hackathon</a>
    <p>Good luck with your event!</p>
@endsection





@extends('emails.layout')

@section('content')
    <h2>Team Created Successfully!</h2>
    <p>Hello {{ $team->leader->name }},</p>
    <p>Your team <strong>{{ $team->name }}</strong> has been successfully created for the hackathon <strong>{{ $hackathon->title }}</strong>.</p>
    <p>You are now the team leader. You can manage your team, invite members, and submit your project.</p>
    <a href="{{ $hackathonUrl }}" class="button">View Hackathon</a>
    <p>Good luck with your hackathon!</p>
@endsection





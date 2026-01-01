@extends('emails.layout')

@section('content')
    <h2>Results Published!</h2>
    <p>Hello {{ $team->leader->name }},</p>
    <p>The results for <strong>{{ $hackathon->title }}</strong> have been published!</p>
    @if($isWinner)
        <p style="font-size: 18px; color: #2563eb; font-weight: bold;">🎉 Congratulations! Your team placed {{ $position }}{{ $position == 1 ? 'st' : ($position == 2 ? 'nd' : 'rd') }}!</p>
    @else
        <p>Thank you for leading your team in the hackathon. Check out the winners and results below.</p>
    @endif
    <a href="{{ $hackathonUrl }}" class="button">View Results</a>
    <p>Thank you for your participation!</p>
@endsection





@extends('emails.layout')

@section('content')
    <h2 style="color: #dc2626;">🚨 Critical System Failure</h2>
    <p>A critical system failure has been detected:</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">{{ $message }}</p>
    </div>
    @if(!empty($context))
        <h3>Additional Context:</h3>
        <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ json_encode($context, JSON_PRETTY_PRINT) }}</pre>
    @endif
    <p>Please investigate and resolve this issue immediately.</p>
@endsection





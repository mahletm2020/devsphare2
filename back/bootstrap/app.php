<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Dispatch SystemFailureCritical event for critical errors
        $exceptions->report(function (\Throwable $e) {
            // Only dispatch for critical errors (500 level)
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                if ($e->getStatusCode() >= 500) {
                    event(new \App\Events\SystemFailureCritical(
                        'Critical system error: ' . $e->getMessage(),
                        [
                            'exception' => get_class($e),
                            'file' => $e->getFile(),
                            'line' => $e->getLine(),
                            'trace' => $e->getTraceAsString(),
                        ]
                    ));
                }
            } elseif ($e instanceof \Error || $e instanceof \ParseError) {
                // Critical PHP errors
                event(new \App\Events\SystemFailureCritical(
                    'Critical PHP error: ' . $e->getMessage(),
                    [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ]
                ));
            }
        });
    })->create();

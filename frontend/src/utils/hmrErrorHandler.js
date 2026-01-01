// Suppress Vite HMR WebSocket connection errors
// This prevents console spam from harmless WebSocket connection attempts

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Override console.error to filter out WebSocket errors
console.error = function(...args) {
  const message = args[0]?.toString() || '';
  const errorMessage = args[0]?.message || '';
  const stack = args[0]?.stack || '';
  
  // Filter out WebSocket connection errors
  const isWebSocketError = (
    (message.includes('WebSocket') || message.includes('websocket') || errorMessage.includes('WebSocket')) &&
    (message.includes('failed to connect') || 
     message.includes('closed without opened') ||
     message.includes('[vite]') ||
     message.includes('ws://localhost') ||
     stack.includes('WebSocket') ||
     stack.includes('client:423') ||
     stack.includes('client:745') ||
     stack.includes('client:772'))
  );
  
  if (isWebSocketError) {
    // Silently ignore WebSocket connection errors
    return;
  }
  // Log other errors normally
  originalError.apply(console, args);
};

// Override console.warn to filter out WebSocket warnings
console.warn = function(...args) {
  const message = args[0]?.toString() || '';
  // Filter out WebSocket warnings
  if (
    (message.includes('WebSocket') || message.includes('websocket')) &&
    (message.includes('[vite]') || message.includes('failed to connect') || message.includes('ws://localhost'))
  ) {
    // Silently ignore WebSocket warnings
    return;
  }
  // Log other warnings normally
  originalWarn.apply(console, args);
};

// Catch unhandled promise rejections from WebSocket
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    const stack = event.reason?.stack || '';
    
    if (
      message.includes('WebSocket') || 
      message.includes('websocket') ||
      message.includes('closed without opened') ||
      stack.includes('WebSocket') ||
      stack.includes('client:423')
    ) {
      event.preventDefault();
      return;
    }
  });
  
  // Also catch errors from Vite client
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const stack = event.error?.stack || '';
    
    if (
      (message.includes('WebSocket') || message.includes('websocket')) &&
      (message.includes('failed to connect') || 
       message.includes('closed without opened') ||
       stack.includes('client:423') ||
       stack.includes('client:745') ||
       stack.includes('client:772'))
    ) {
      event.preventDefault();
      return;
    }
  });
}


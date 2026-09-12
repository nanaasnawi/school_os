import { NextResponse } from 'next/server';
import net from 'net';

export async function GET() {
  const isConnected = await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(5774, '127.0.0.1');
  });

  return NextResponse.json({
    success: true,
    data: {
      connected: isConnected,
      status: isConnected ? 'ONLINE' : 'OFFLINE',
      message: isConnected
        ? 'Terhubung ke Aplikasi Dapodik Lokal di http://localhost:5774.'
        : 'Dapodik Localhost (http://localhost:5774) sedang OFFLINE / tidak terjangkau.',
      dapodik_url: 'http://localhost:5774',
      last_checked_at: new Date().toISOString(),
    },
  });
}

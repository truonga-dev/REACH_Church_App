import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, url } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      return NextResponse.json(
        { error: 'OneSignal credentials not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Subscribed Users'],
        headings: { en: title, vi: title },
        contents: { en: message, vi: message },
        url: url || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OneSignal API Error:', data);
      return NextResponse.json({ error: 'Failed to send notification', details: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {  
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, message, url } = await request.json();

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      console.warn('OneSignal App ID or REST API Key is missing');
      return NextResponse.json({ success: false, error: 'Missing OneSignal credentials' }, { status: 500 });
    }

    const payload = {
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: { en: title, vi: title },
      contents: { en: message, vi: message },
      url: url || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/`,
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OneSignal Error:', errorData);
      return NextResponse.json({ success: false, error: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

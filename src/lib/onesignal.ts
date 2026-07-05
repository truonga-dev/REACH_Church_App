import OneSignal from 'react-onesignal';
import { getNotificationsEnabled } from '@/lib/user-preferences';

let initPromise: Promise<void> | null = null;

export function isPushServiceUnavailableError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('push service not available')
    );
  }
  return false;
}

export function isBrowserPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    window.isSecureContext
  );
}

function getAppId(): string | undefined {
  return process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
}

export async function initOneSignal(): Promise<boolean> {
  const appId = getAppId();
  if (!appId || !isBrowserPushSupported()) return false;

  if (initPromise) {
    try {
      await initPromise;
      return true;
    } catch {
      return false;
    }
  }

  initPromise = OneSignal.init({
    appId,
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerPath: '/OneSignalSDKWorker.js',
    autoRegister: false,
    autoResubscribe: false,
    notifyButton: {
      enable: false,
    } as any,  
    promptOptions: {
      slidedown: {
        prompts: [
          {
            type: 'push',
            autoPrompt: false,
            delay: { pageViews: 999, timeDelay: 999999 },
          },
        ],
      },
    },
  });

  try {
    await initPromise;
    return true;
  } catch (error) {
    initPromise = null;
    if (!isPushServiceUnavailableError(error)) {
      console.warn('OneSignal initialization failed:', error);
    }
    return false;
  }
}

export async function promptForPushNotifications(): Promise<boolean> {
  const ready = await initOneSignal();
  if (!ready) return false;

  try {
    if (OneSignal.Slidedown) {
      await OneSignal.Slidedown.promptPush();
    }
    return true;
  } catch (error) {
    if (!isPushServiceUnavailableError(error)) {
      console.warn('Failed to prompt for push notifications:', error);
    }
    return false;
  }
}

export async function optOutOfPushNotifications(): Promise<void> {
  try {
    if (OneSignal.User?.PushSubscription) {
      await OneSignal.User.PushSubscription.optOut();
    }
  } catch {
    // User may not have been subscribed
  }
}

/** Initialize OneSignal only when the user has opted in to notifications. */
export async function syncOneSignalIfEnabled(): Promise<void> {
  if (!getNotificationsEnabled()) return;
  await initOneSignal();
}

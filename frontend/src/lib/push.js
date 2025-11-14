import { axiosInstance } from "./axios";

let cachedPublicKey = null;

const base64UrlToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const ensurePushSupported = () => {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported in this browser.");
    return false;
  }
  if (!("PushManager" in window)) {
    console.warn("Push notifications are not supported in this browser.");
    return false;
  }
  return true;
};

const fetchVapidPublicKey = async () => {
  if (cachedPublicKey) return cachedPublicKey;
  const { data } = await axiosInstance.get("/push-subscriptions/public-key");
  if (!data?.publicKey) {
    throw new Error("Server did not return a VAPID public key.");
  }
  cachedPublicKey = data.publicKey;
  return cachedPublicKey;
};

export const subscribeToPush = async () => {
  if (!ensurePushSupported()) return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await axiosInstance.post("/push-subscriptions", {
      subscription: existing,
      userAgent: navigator.userAgent,
    });
    return existing;
  }

  const publicKey = await fetchVapidPublicKey();
  const applicationServerKey = base64UrlToUint8Array(publicKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  await axiosInstance.post("/push-subscriptions", {
    subscription,
    userAgent: navigator.userAgent,
  });

  return subscription;
};

export const unsubscribeFromPush = async () => {
  if (!ensurePushSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;

  await axiosInstance.delete("/push-subscriptions", {
    data: { endpoint: subscription.endpoint },
  });

  await subscription.unsubscribe();
  return true;
};

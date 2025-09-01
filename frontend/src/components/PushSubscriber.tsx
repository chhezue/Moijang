"use client";
import { useEffect, useState } from "react";
import api from "@/apis/apiClient";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const PushSubscriber = () => {
  const [isNotificationPermissionAlert, setIsNotificationPermissionAlert] =
    useState(false);

  useEffect(() => {
    function urlBase64ToUint8Array(base64String: string) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    async function registerAndSubscribe() {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          // 1. 서비스 워커 등록
          const registration =
            await navigator.serviceWorker.register("/service-worker.js");
          console.log("Service Worker registered.");

          // 3. 이미 구독했는지 확인 (구독했다면 아무것도 하지 않음)
          const existingSubscription =
            await registration.pushManager.getSubscription();
          if (existingSubscription) {
            setIsNotificationPermissionAlert(false);
            console.log("User is already subscribed.");
            return;
          }

          // 2. 알림 권한 요청
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setIsNotificationPermissionAlert(true);
            throw new Error("Permission not granted for Notification");
          }

          // 3. VAPID 공개키 가져오기
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!publicKey) {
            console.error("VAPID public key is not defined.");
            return;
          }

          // 4. 푸시 구독
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey), // URL-safe base64 encoded VAPID public key
          });

          // 5. 구독 정보를 백엔드 서버로 전송
          await api.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/web-push/subscribe`,
            { subscription }
          );
        } catch (error) {
          console.error("Failed to subscribe the user: ", error);
        }
      }
    }
    registerAndSubscribe().then();
  }, []);

  return (
    <>
      {isNotificationPermissionAlert}
      {isNotificationPermissionAlert && (
        <Snackbar
          open={isNotificationPermissionAlert}
          sx={{
            bottom: { xs: 0, sm: 0 },
            width: "100%",
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="warning"
            sx={{
              width: "100%",
            }}
            onClose={() => {
              setIsNotificationPermissionAlert(false);
            }}
          >
            공구 진행 소식을 받으려면 알림을 켜주세요. 주소창 왼쪽 아이콘을
            눌러서 &apos;알림 허용&apos;을 활성화해 주세요.
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default PushSubscriber;

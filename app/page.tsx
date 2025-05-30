"use client";

import { useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { Subscription } from 'rxjs';


Amplify.configure(outputs);
const client = generateClient<Schema>();

function LoginApp() {
  const [logins, setLogins] = useState<Array<Schema["Login"]["type"]>>([]);
  const [showHistory, setShowHistory] = useState(false);
//  const subscriptionRef = useRef<ReturnType<typeof client.models.Todo.observeQuery> | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const { user, authStatus, signOut } = useAuthenticator(context => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  const isWritingRef = useRef(false);

  // 🔸 書き込み処理（セッション＋useRef）
  useEffect(() => {
    if (authStatus === "authenticated" && user && !isWritingRef.current) {
      const loginId = user.signInDetails?.loginId;
      if (!loginId) return;

      const sessionKey = `hasLogged_${loginId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      isWritingRef.current = true;

      const loginTime = new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });

      client.models.Login.create({
        uid: loginId,
        loginTime:  loginTime
      }).then(() => {
        sessionStorage.setItem(sessionKey, "true");
      }).catch(err => {
        console.error("書き込み失敗:", err);
      });
    }
  }, [authStatus, user]);

  // 🔸 「履歴を見る」ボタン押下時に購読開始
  const handleShowHistory = () => {
    setShowHistory(true);
    if (subscriptionRef.current) return; // 二重登録防止

    const subscription = client.models.Login.observeQuery().subscribe({
      next: (data) => {
        const sorted = [...data.items]
          .filter((item) => item.loginTime)
          .sort((a, b) =>
            new Date(b.loginTime!).getTime() - new Date(a.loginTime!).getTime()
          )
          .slice(0, 5);
        setLogins(sorted);
      },
    });

    subscriptionRef.current = subscription;
  };

  // 🔸 アンマウント時に購読解除
  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    sessionStorage.clear();
    signOut();
    window.location.reload();
  };

 {/*
  const deleteTodo = (id: string) => {
    client.models.Todo.delete({ id });
  };*/}

  return (
    <main style={{ padding: "1.5rem" }}>
      <p>こんにちは、{user?.signInDetails?.loginId} さん！</p>

      {!showHistory && (
        <button onClick={handleShowHistory}>履歴を見る</button>
      )}

      {showHistory && (
        <ul>
          {logins.map((login) => (
            <li key={login.id}>
              {login.uid}
              {login.loginTime}
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "2rem" }}>
        <button onClick={handleSignOut}>サインアウト</button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Authenticator>
      <LoginApp />
    </Authenticator>
  );
}

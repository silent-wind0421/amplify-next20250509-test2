"use client";

import { useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";

Amplify.configure(outputs);
const client = generateClient<Schema>();

function TodoApp() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const hasLoggedRef = useRef<string | null>(null); // 直近ログインユーザー記録用

  const { user, authStatus, signOut } = useAuthenticator(context => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  // 🔸 最新5件まで取得・更新
  useEffect(() => {
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => {
        const sorted = [...data.items]
          .filter((item) => item.createdAt)
          .sort(
            (a, b) =>
              new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
          )
          .slice(0, 5);
        setTodos(sorted);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  // 🔸 初回ログイン時に 1 回だけ書き込む
  useEffect(() => {
    if (authStatus === "authenticated" && user) {
      const loginId = user.signInDetails?.loginId ?? user.username;

      // すでに書き込み済みならスキップ
      if (hasLoggedRef.current === loginId) return;

      hasLoggedRef.current = loginId;

      const loginTime = new Date().toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });

      client.models.Todo.create({
        content: `${loginId} がログインしました (${loginTime})`,
      }).catch((err) => {
        console.error("書き込み失敗:", err);
      });
    }
  }, [authStatus, user]);

  const deleteTodo = (id: string) => {
    client.models.Todo.delete({ id });
  };

  return (
    <main style={{ padding: "1.5rem" }}>
      <p>こんにちは、{user?.signInDetails?.loginId ?? user?.username} さん！</p>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
            {todo.content}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "2rem" }}>
        <button onClick={signOut}>サインアウト</button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Authenticator>
      <TodoApp />
    </Authenticator>
  );
}


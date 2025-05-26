"use client";

import { useState, useEffect } from "react";
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
  const { user, authStatus, signOut } = useAuthenticator(context => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      const subscription = client.models.Todo.observeQuery().subscribe({
        next: (data) => setTodos([...data.items]),
      });

      return () => subscription.unsubscribe(); // クリーンアップ
    }
  }, [authStatus]);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>My todos</h1>
      <p>こんにちは、{user?.signInDetails?.loginId} さん！</p>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
            {todo.content}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "2rem" }}>
        <p>🥳 App successfully hosted. Try creating a new todo.</p>
        <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
          Review next steps of this tutorial.
        </a>
      </div>

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

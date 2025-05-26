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

function UserNameDisplay() {
  const { user } = useAuthenticator();
  return (
    <div>
      <h1>こんにちは、{user?.signInDetails?.loginId} さん！</h1>
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuthenticator();
  return (
    <button onClick={signOut}>
      サインアウト
    </button>
  );
}

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }
  
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  return (
    <Authenticator>
      <main>
        <h1>My todos</h1>
        <UserNameDisplay/>
        <button onClick={createTodo}>+ new</button>
        <ul>
        {todos.map(todo => <li
          onClick={() => deleteTodo(todo.id)}
          key={todo.id}>
          {todo.content}
        </li>)}
        </ul> 
        
        <div>
          🥳 App successfully hosted. Try creating a new todo.
          

          <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
            Review next steps of this tutorial.
          </a>
        </div>
        <SignOutButton/>
      </main>
    </Authenticator>
  );
}


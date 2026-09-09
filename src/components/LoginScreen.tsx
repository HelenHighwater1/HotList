import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { RoughFrame } from "./RoughFrame";
import { THEME } from "../lib/theme";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!signIn(username.trim(), password)) {
      setError("That username and password don't match.");
      setPassword("");
    }
  }

  return (
    <div className="login">
      <form className="panel login-card" onSubmit={onSubmit}>
        <RoughFrame seed={21} stroke={THEME.ink} fill={THEME.panel} strokeWidth={1.4} />
        <div className="brand">
          <h1>Hot List</h1>
          <p className="tagline">Sign in to see what actually matters right now.</p>
        </div>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary" type="submit">
          Sign in
        </button>

        <p className="login-hint mono">Prototype login: user1 / password</p>
      </form>
    </div>
  );
}

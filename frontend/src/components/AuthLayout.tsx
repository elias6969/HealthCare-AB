import { ReactNode } from "react";
import "./auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Healthcare AB</h1>
        {children}
      </div>
    </div>
  );
}

import { Navigate, Outlet } from "react-router-dom";

export default function PrivateOutlet() {
  const auth = true;

  return auth ? <Outlet /> : <Navigate to="/login" />;
}

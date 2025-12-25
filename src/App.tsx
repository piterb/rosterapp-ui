import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { Callback } from "./pages/Callback";
import { Home } from "./pages/Home";
import { getBasePath } from "./utils/basePath";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        basename={getBasePath()}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

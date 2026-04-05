import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { RandomPicker } from "@/pages/RandomPicker";

const basename =
  import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") || "";

const App = () => (
  <BrowserRouter basename={basename || undefined}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="random" element={<RandomPicker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;

import { Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/toast";
import { LibraryProvider } from "./context/LibraryContext";
import Detail from "./pages/Detail";
import Home from "./pages/Home";

export default function App() {
  return (
    <LibraryProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/asset/:id" element={<Detail />} />
      </Routes>
      <Toaster />
    </LibraryProvider>
  );
}

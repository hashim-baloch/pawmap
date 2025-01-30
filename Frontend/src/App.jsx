import AnimalMap from "./components/Map";
import AuthButton from "./components/AuthButton";
import "./App.css";
import logo from "./assets/logo.svg";
import { AnimalProvider } from "./components/AnimalContext";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <>
      <a href="/">
        <img src={logo} alt="PawMap" className="logo" />
      </a>
      <AnimalProvider>
        <ErrorBoundary>
          <AuthButton />
          <AnimalMap />
        </ErrorBoundary>
      </AnimalProvider>
    </>
  );
}

export default App;

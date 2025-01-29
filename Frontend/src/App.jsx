import Map from "./components/Map";
import AuthButton from "./components/AuthButton";
import "./App.css";
import logo from "./assets/logo.svg";

function App() {
  return (
    <>
      <a href="/">
        <img src={logo} alt="PawMap" className="logo" />
      </a>
      <AuthButton />
      <Map />
    </>
  );
}

export default App;

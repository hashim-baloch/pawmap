import Map from "./components/Map";
import AuthComponent from "./components/AuthComponent";
import "./App.css";
import logo from "./assets/logo.svg";
function App() {
  return (
    <>
      <a href="/">
        <img src={logo} alt="PawMap" className="logo" />
      </a>
      <AuthComponent />
      <Map />
    </>
  );
}

export default App;

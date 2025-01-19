import Map from "./components/Map";
import "./App.css";
import logo from "./assets/logo.svg";
function App() {
  return (
    <>
      <a href="/">
        <img src={logo} alt="PawMap" className="logo" />
      </a>
      <Map />
    </>
  );
}

export default App;

import { useState } from "react";
import { login, register } from "../services/api";
import "./AuthButton.css";

function AuthButton() {
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = isLogin
        ? await login(formData)
        : await register(formData);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setShowModal(false);
        window.location.reload(); // Refresh to update auth state
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <button className="auth-button" onClick={() => setShowModal(true)}>
        {localStorage.getItem("token") ? "Profile" : "Sign In"}
      </button>

      {showModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <button
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h2>{isLogin ? "Sign In" : "Register"}</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="submit-button">
                {isLogin ? "Sign In" : "Register"}
              </button>
            </form>

            <p className="toggle-text">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                className="toggle-button"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default AuthButton;

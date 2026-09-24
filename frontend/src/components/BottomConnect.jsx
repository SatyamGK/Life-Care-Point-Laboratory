import { useNavigate } from "react-router-dom";

export default function BottomConnect() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="global-health-partner-button"
      onClick={() => navigate("/book-test")}
    >
      <span className="global-health-partner-icon">♡</span>

      <span>Connect with your Health Care Partner</span>
    </button>
  );
}
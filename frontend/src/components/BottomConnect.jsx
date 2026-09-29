import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function BottomConnect() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="global-health-partner-button"
      onClick={() => navigate("/book-test")}
    >
      <span className="global-health-partner-icon"><Icon name="heart" size={16} /></span>

      <span>Connect with your Health Care Partner</span>
    </button>
  );
}
import { useNavigate } from "react-router-dom";

export default function BottomConnect() {
  const navigate = useNavigate();

  return (
    <div className="bottom-connect">

      <button type="button" onClick={() => navigate("/book-test")}>
        <span> ♡ </span>
          Connect with your Health Care Partner
      </button>

    </div>
  );
}
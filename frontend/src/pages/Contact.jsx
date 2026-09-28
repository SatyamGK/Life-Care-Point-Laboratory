import { trackEvent } from "../services/api";
import Icon from "../components/Icon";

export default function Contact() {
  return (
    <section className="contact-page">
      <h1>Contact Us</h1>
      <a className="contact-map" href="https://www.google.com/maps/search/?api=1&query=Life+Care+Point+Laboratory+Indirapuram+Ghaziabad" target="_blank" rel="noopener noreferrer">
        <div className="map-visual">
          <span className="map-marker"><Icon name="pin" size={26} /></span>
          <strong>Life Care Point Laboratory</strong>
          <small>Tap to open Google Maps</small>
        </div>
      </a>

      <div className="contact-card">
        <div className="contact-icon"><Icon name="pin" size={20} /></div>
        <div><b>Address</b><p>Life Care Point Laboratory,<br/>1033, Ground Floor, Niti Khand-1,<br/>Opposite Orange County,<br/>Indirapuram, Ghaziabad,<br/>Uttar Pradesh - 201014</p></div>
      </div>

      <a href="tel:+919910108453" onClick={() => trackEvent("call_click")} className="contact-card">
        <div className="contact-icon"><Icon name="phone" size={20} /></div>
        <div><b>Contact Number</b><p>+91 9910108453</p></div>
      </a>

      <div className="contact-card">
        <div className="contact-icon"><Icon name="clock" size={20} /></div>
        <div><b>Timings</b><p>Mon-Sat: 8:00 AM - 8:00 PM<br/>Sunday: 8:00 AM - 2:00 PM</p></div>
      </div>

      <div className="follow-us">
        <span>Follow Us</span>
        <div>
          <a href="https://www.facebook.com/lifecarepointlaboratory" target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook" size={18}/></a>
          <a href="https://www.instagram.com/lifecarepointlaboratory/" target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" size={18}/></a>
          <a href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X"><Icon name="x" size={18}/></a>
          <a href="https://www.youtube.com/@lifecarepointlaboratory" target="_blank" rel="noreferrer" aria-label="YouTube"><Icon name="youtube" size={18}/></a>
        </div>
      </div>
    </section>
  );
}

export default function NotFound() {
  return (
    <section className="info-page" aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page Not Found</h1>
      <p>The page you requested does not exist.</p>
      <a className="detail-book-button" href="/">
        Go to Home
      </a>
    </section>
  );
}

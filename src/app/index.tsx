export default function StaticTestPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Google Ads Creator</h1>
      <p>If you can see this page, static rendering is working correctly.</p>
      <p>You should be redirected to the login page shortly.</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Simple redirect script to ensure client-side navigation works
            setTimeout(() => {
              window.location.href = '/login';
            }, 3000);
          `,
        }}
      />
    </div>
  );
} 
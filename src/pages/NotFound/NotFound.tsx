
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-black text-gray-200">404</h1>
        <p className="text-gray-500 font-medium">Page not found</p>
        <a
          href="/"
          className="inline-block text-[#6d28d9] hover:text-[#5b21b6] font-semibold text-sm hover:underline"
        >
          ← Back to home
        </a>
      </div>
    </div>
  );
}

export default NotFound;

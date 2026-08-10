function AuthLayout({ title, children, secondaryAction }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">A secure authentication flow with modern React and Tailwind.</p>
        </div>
        {children}
        {secondaryAction && <div className="mt-6 text-center text-sm text-slate-500">{secondaryAction}</div>}
      </div>
    </div>
  );
}

export default AuthLayout;

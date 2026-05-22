import LoginForm from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const params = await searchParams;
  const isLocked = params.locked === '1';

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <LoginForm isLocked={isLocked} />
    </div>
  );
}

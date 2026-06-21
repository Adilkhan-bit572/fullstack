import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'

import { useAuth } from '@/hooks/Authhook' 

const RootLayout = () => {
  const {user: me} = useAuth()

  return (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <div className='ml-auto'>
          {me ? <Link to="/myprofile">Hi, {me.name}!</Link> : <>
          <Link to="/login" className="[&.active]:font-bold">
            Login
          </Link>
          </>
          }
        </div>
      </div>
      <hr />
      <Toaster/>
      <Outlet />
      <TanStackRouterDevtools />
    </>
)}

export const Route = createRootRoute({ component: RootLayout })
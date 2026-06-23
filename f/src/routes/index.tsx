import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-2 flex flex-col items-center">
      <h1 className='m-4 font-bold'>Welcome to my Konoha project!</h1>
      <p>This is my pet project for learning</p>
      <img src='/assets/images/logo.jpg' alt='logo' width={600} height={800}/>
    </div>
  )
}
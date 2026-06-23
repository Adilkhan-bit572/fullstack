import { PostItem } from '@/components/items/postItem'
import { isLoggedIn, useAuth} from '@/hooks/Authhook'
import { createFileRoute, redirect} from '@tanstack/react-router'
import { getUsersItemsUserIdItemsGet } from '@/client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Profile } from '@/components/profile/profile'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion'
import { CreateItemMenu } from '@/components/items/createItem'
import { UpdateBioMenu } from '@/components/profile/updateBioMenu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export const Route = createFileRoute('/myprofile')({
  component: RouteComponent,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})


const PAGE_SIZE = 5

function RouteComponent() {

  const { logout, user } = useAuth()
  const [page, setPage] = useState(1)
  const [showBioMenu, setShowBioMenu] = useState(false)
  const offset = (page - 1) * PAGE_SIZE

  const {data} = useQuery({
    queryKey: ["items", user!.id, page],
    queryFn: async () => (await getUsersItemsUserIdItemsGet({
      path: {id: user!.id},
      query: {offset, limit: PAGE_SIZE},
    })).data,
    placeholderData: keepPreviousData,
  })

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))

  return (<div className='flex flex-row'>
    <div  className='w-1/3'>
      <Profile {...user!}>
        <Button className='bg-blue-500 hover:bg-blue-800' onClick={() => logout()}>logout</Button>
        <Button onClick={() => setShowBioMenu((s) => !s)}>Update bio</Button>
      </Profile>
      {showBioMenu && (
        <div className='mt-4'>
          <UpdateBioMenu currentBio={user!.bio} onSuccess={() => setShowBioMenu(false)} />
        </div>
      )}
    </div>
    <div className='w-2/3'>
    <Accordion>
      <AccordionItem>
        <AccordionTrigger >Create New Item?</AccordionTrigger>
        <AccordionContent className='w-full'>
          <CreateItemMenu />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <p> Items : {data?.count}</p>
    {data?.data.map((item) => <PostItem key={item.id} {...item}/>)}

    <Pagination className='mt-4'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
        </PaginationItem>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              isActive={p === page}
              className='cursor-pointer'
              onClick={() => setPage(p)}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
    </div>
  </div>)

}

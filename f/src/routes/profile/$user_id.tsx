import { getUserByIdUserIdGet, getUsersItemsUserIdItemsGet } from '@/client'
import { PostItem } from '@/components/items/postItem'
import { Profile } from '@/components/profile/profile'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/profile/$user_id')({
  component: RouteComponent,
})

const PAGE_SIZE = 5

function RouteComponent() {
  const { user_id } = Route.useParams()
  const { data, error, isError, isLoading} = useQuery({
    queryKey:["user", user_id],
    queryFn: async () => {
      const res = await getUserByIdUserIdGet({
        path: { id: user_id },
      })

      if (res.error) throw res.error
      return res.data
    }
  })
    const [page, setPage] = useState(1)
  const offset = (page - 1) * PAGE_SIZE

  const { data: items_data} = useQuery({
    queryKey: ["items", user_id, page],
    queryFn: async () => (await getUsersItemsUserIdItemsGet({
      path: {id: user_id},
      query: {offset, limit: PAGE_SIZE},
    })).data,
    placeholderData: keepPreviousData,
  })


  if (isLoading) return <p>Loading...</p>

  if (isError) {
    return <p>Error: {(error as Error).message}</p>
  }

  const totalPages = Math.max(1, Math.ceil((items_data?.count ?? 0) / PAGE_SIZE))

  return (<div className='flex flex-row'>
    <div  className='w-1/3'>
      <Profile {...data!}></Profile>
    </div>
    <div className='w-2/3'>
    <p> Items : {items_data?.count}</p>
    {items_data?.data.map((item) => <PostItem key={item.id} {...item}/>)}

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

import type { Item as ItemProps } from '../../client/types.gen'

export function PostItem({
  id,
  created_at,
  author_id,
  title,
  text,
}: ItemProps) {
  return (
    <article className="rounded-lg border p-4 shadow-sm">
      <header className="mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>#{id}</span>
          <span> | </span>
          <span>Author: {author_id}</span>
        </div>

        <h2 className="mt-1 text-xl font-semibold">
          {title}
        </h2>
      </header>

      <p className="whitespace-pre-wrap">
        {text}
      </p>

      <footer className="mt-4 text-xs text-muted-foreground">
          {new Date(created_at!).toLocaleDateString()}
      </footer>
    </article>
  )
}
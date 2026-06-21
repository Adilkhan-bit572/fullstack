import { createItemItemPost, type ItemCreate } from '@/client';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const formSchema = z.object({
  title: z.string().min(1, "Title must be at least 1 character").max(25, "Title must be at most 25 characters"),
  text: z.string().min(1, "Text is required").max(2000, "Text must be at most 1000 characters"),
})

type formType = z.infer<typeof formSchema>

export function CreateItemMenu() {
  const queryClient = useQueryClient();
  const form = useForm<formType>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      text: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: ItemCreate) => {
      const { data: result, error } = await createItemItemPost({ body: data })
      if (error) {
        throw new Error("Failed to create item")
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Item created!")
      form.reset()
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create item")
    },
  })

  const onSubmit = (data: formType) => {
    createPostMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create item</CardTitle>
        <CardDescription>Share something new.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What's on your mind?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

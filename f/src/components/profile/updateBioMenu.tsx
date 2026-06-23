import { updateBioUserPut, type UserUpdateBio } from '@/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
  new_bio: z.string().max(2000, "Bio must be at most 2000 characters"),
})

type formType = z.infer<typeof formSchema>

type UpdateBioMenuProps = {
  currentBio?: string | null
  onSuccess?: () => void
}

export function UpdateBioMenu({ currentBio, onSuccess }: UpdateBioMenuProps) {
  const queryClient = useQueryClient();
  const form = useForm<formType>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_bio: currentBio ?? "",
    },
  });

  const updateBioMutation = useMutation({
    mutationFn: async (data: UserUpdateBio) => {
      const { data: result, error } = await updateBioUserPut({ body: data })
      if (error) {
        throw new Error("Failed to update bio")
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Bio updated!")
      queryClient.invalidateQueries({ queryKey: ["me"] })
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update bio")
    },
  })

  const onSubmit = (data: formType) => {
    updateBioMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update bio</CardTitle>
        <CardDescription>Tell others about yourself.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="new_bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What's on your mind?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={updateBioMutation.isPending}>
              {updateBioMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

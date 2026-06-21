import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { z } from "zod"
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isLoggedIn, useAuth } from '@/hooks/Authhook'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

const formSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters").max(15, "Name must be at most 15 characters"),
  plain_pwd: z.string().min(8, "Password must be at least 8 characters"),
})

type formType = z.infer<typeof formSchema>

function RouteComponent() {
  const navigate = useNavigate();
  const form = useForm<formType>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      plain_pwd: "",
    },
  });
  const { signUpMutation} = useAuth();

  const onSubmit = (data: formType) => {
    signUpMutation.mutate(data);
  }

  return (
    <div className='flex items-center justify-center h-screen'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Create an account!</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Name</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plain_pwd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className='flex-col gap-2'>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-800" disabled={signUpMutation.isPending}>
                {signUpMutation.isPending ? "Signing up..." : "Sign Up"}
              </Button>
              <p>Already have an account?{" "}
                <a
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
                  onClick={() => navigate({ to: "/login" })}> Login</a>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}

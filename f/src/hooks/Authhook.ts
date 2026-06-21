import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getMeUserMeGet, newUserUserPost, type UserCreate, type UserOut, type BodyLoginAccessTokenLoginAccessTokenPost as AccessToken, loginAccessTokenLoginAccessTokenPost} from "../client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const isLoggedIn = () => {
    return localStorage.getItem("access_token") !== null
}

// Turn an API error body (FastAPI `{detail}` or a 422 validation array) into a readable message.
const getErrorMessage = (error: unknown, fallback: string): string => {
    const detail = (error as { detail?: unknown } | null | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        const msg = detail.map((d) => (d as { msg?: string })?.msg).filter(Boolean).join(", ");
        if (msg) return msg;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export const useAuth = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();


    const { data: user} = useQuery<UserOut | null, Error>({
        queryKey:["me"],
        queryFn: async () => {
            const response = await getMeUserMeGet();
            return response.data ?? null;
        },
        enabled: isLoggedIn()
    })

      const login = async (data: AccessToken) => {
        const { data: result, error } = await loginAccessTokenLoginAccessTokenPost({
        body: data,
        })

        if (error) {
        throw new Error(getErrorMessage(error, "Login failed"));
        }

        const token = result?.access_token;
        if (!token) {
        throw new Error("Login succeeded but no access token was returned");
        }

        localStorage.setItem("access_token", token);
    }


    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["me"],
            });
            navigate({ to: "/" })
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, "Login failed"));
        },

    })

    const signUpMutation = useMutation({
        mutationFn: async (data: UserCreate) => {
            const { data: result, error } = await newUserUserPost({ body: data })
            if (error) {
                throw new Error(getErrorMessage(error, "Sign up failed"));
            }
            return result;
        },
        onSuccess: () => {
        toast.success("Account created! Please log in.")
        navigate({ to: "/login" })
        },
        onError: (error) => {
        toast.error(getErrorMessage(error, "Sign up failed"));
        },
        onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["me"] })
        },
    })

    const logout = () => {
        queryClient.setQueryData(["me"], null)
        localStorage.removeItem("access_token")
        navigate({ to: "/login" })
    }

    return { user, signUpMutation, loginMutation, logout}
}
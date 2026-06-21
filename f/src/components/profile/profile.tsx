import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import type { UserOut } from "@/client";
import type { PropsWithChildren } from "react";

type ProfileProps = PropsWithChildren<UserOut>;

export function Profile({ id, created_at, name, bio , children }: ProfileProps) {

    return (<Card>
        <CardHeader>
            <CardTitle>{name}</CardTitle>
            <CardDescription>#{id} | {new Date(created_at).toLocaleDateString()}</CardDescription>
        </CardHeader>
{/* --------------------------- */}
        <CardContent>
            {bio ? <p>{bio}</p> : <p className="text-muted-foreground">No bio</p>}
        </CardContent>
{/* ---------------------------- */}
        <CardFooter>
            {children}
        </CardFooter>
    </Card>)
}
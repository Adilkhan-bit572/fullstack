import { useNavigate } from '@tanstack/react-router'
import { Button } from '../ui/button'

type ErrorComponentProps = {
    errorMessage?: string
}

export function ErrorComponent({ errorMessage }: ErrorComponentProps) {
    const navigate = useNavigate()

    return (<div className="flex flex-col items-center justify-center m-5">
        <img src='/assets/images/errorImage.jpg' alt="Error" width="300" height="200"/>
        {errorMessage ? <p>{errorMessage}</p> : <p>Unknown Error</p>}
        <Button onClick={() => navigate({to: "/"})} className='bg-blue-500 hover:bg-blue-800'> Main</Button>
    </div>)
}
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export const useUsernamePasswordLogin = (credentials) => {
    const loginUser = async ({ signal }) => {
        const response = await axios.post(
            `${import.meta.env.VITE_APP_ENDPOINT}/api/auth/external`,
            {
                email: credentials.email,
                password: credentials.password,
            },
            {
                signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        return response.data
    }

    const query = useQuery({
        queryKey: ['login-username'],
        queryFn: loginUser,
        enabled: false,
        refetchOnWindowFocus: false,
        retry: 0,
    })

    return query
}

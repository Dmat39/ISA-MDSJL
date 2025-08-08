import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export const useLogin = (credentials) => {
    const loginUser = async ({ signal }) => {        
        const formData = new FormData()
        Object.entries(credentials).forEach(([key, value]) => {
            formData.append(key, value)
        })

        const response = await axios.post(
            `${import.meta.env.VITE_APP_ENDPOINT}/api/auth/login/web`,
            formData,
            {
                signal,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )
        return response.data
    }


    const query = useQuery({
        queryKey: ['login'],
        queryFn: loginUser,
        enabled: false,
        refetchOnWindowFocus: false,
        retry: 0,
    })

    return query
}
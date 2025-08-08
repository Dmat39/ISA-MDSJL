import { Outlet } from 'react-router'
import Navbar from '../Components/General/Navbar'

const Layout = () => {
    return (
        <div className='h-full flex flex-col bg-gray-50'>
            <main className='pb-0 flex-1 max-h-full overflow-y-auto'>
                <div className='h-full'>
                    <Outlet />
                </div>
            </main>
            <Navbar />
        </div>
    )
}

export default Layout
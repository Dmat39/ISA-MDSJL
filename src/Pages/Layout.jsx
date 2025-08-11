import { Outlet } from 'react-router'
import Navbar from '../Components/General/Navbar'

const Layout = () => {
    return (
        <div className='h-screen w-full flex flex-col bg-gray-50 overflow-hidden'>
            <main className='flex-1 overflow-y-auto pb-20'>
                <div className='min-h-full h-full'>
                    <Outlet />
                </div>
            </main>
            <div className='fixed botton-0 left-0 rigth-0 z-50 bg-hhite'>
                <Navbar />
            </div>
        </div>
    )
}

export default Layout
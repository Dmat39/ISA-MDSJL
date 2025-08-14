import { Outlet } from 'react-router'
import Navbar from '../Components/General/Navbar'

const Layout = () => {
    return (
        <div className='h-screen w-full flex flex-col bg-gray-50 relative'>
            {/* Main content - scrollable area */}
            <main className='flex-1 overflow-y-auto pb-20'>
                <div className='min-h-full w-full'>
                    <Outlet />
                </div>
            </main>
            
            {/* Fixed Navbar at bottom */}
            <div className='fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200'>
                <Navbar />
            </div>
        </div>
    )
}

export default Layout
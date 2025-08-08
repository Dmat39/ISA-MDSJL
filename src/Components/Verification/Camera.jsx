import PersonIcon from '@mui/icons-material/Person';
import { CircularProgress } from '@mui/material';

const Camera = ({ cameraActive, videoRef, photo, isLoading }) => {
    return (
        <div className="flex items-center justify-center relative w-full h-full container">
            <div className="bg-slate-800 aspect-square p-0 rounded-full max-w-[350px] w-[90%] flex items-center justify-center overflow-hidden relative">
                {cameraActive ? (
                    photo ? (
                        <>
                            {isLoading &&
                                <CircularProgress
                                    thickness={.7}
                                    sx={{
                                        position: 'absolute',
                                        width: '100% !important',
                                        height: '100% !important',
                                        top: 0,
                                        left: 0,
                                    }}
                                />
                            }
                            <div className="bg-slate-800 aspect-square p-0 rounded-full max-w-[350px] w-[100%] flex items-center justify-center overflow-hidden">
                                <img src={photo} alt="Captured" className="w-full h-full object-cover rounded-full" />
                            </div>
                        </>
                    ) : (
                        < video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-full"
                        />
                    )
                ) : (
                    <div className='w-full h-full flex items-center justify-center p-8'>
                        <PersonIcon className="text-white !w-full !h-full" />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Camera
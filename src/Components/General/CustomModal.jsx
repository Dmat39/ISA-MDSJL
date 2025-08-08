import { Box, CircularProgress, Fade, IconButton, Modal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CustomModal = ({ children, Open, handleClose, className, isLoading }) => {
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        maxHeight: '90%',
        overflow: 'hidden',
        boxShadow: 24,
        p: 4,
    };
    return (
        <Modal
            // keepMounted
            open={Open}
            onClose={handleClose}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
            closeAfterTransition={false}
            aria-hidden={!Open}
        >
            <Fade in={Open} >
                <Box sx={style} className={`w-[95%] max-w-2xl rounded-md text-black ${className}`}>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            zIndex: 402
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <div className='overflow-auto pt-0'>
                        {isLoading ?
                            <div className='absolute rounded-lg w-full h-full flex items-center justify-center bg-white/80 z-[401] top-0 left-0'>
                                <CircularProgress size="30px" />
                            </div>
                            : null}
                        {children}
                    </div>
                </Box>
            </Fade>
        </Modal>
    )
}

export default CustomModal
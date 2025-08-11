import { Button, IconButton } from "@mui/material"
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import LocalSeeIcon from '@mui/icons-material/LocalSee';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import { base64ToFile } from "../../utils/fileUtils";


const ActionButtons = ({ cameraActive, getWebcamStream, stopWebcamStream, photo, takePhoto, resetPhoto, CanTakePhoto, handleSubmit, switchCamera }) => {
    return (
        <div>
            {cameraActive ?
                (photo ? (
                    <div className="flex gap-3">
                        <Button
                            className="!capitalize !rounded-md flex gap-1"
                            size="large"
                            variant='text'
                            color='inherit'
                            onClick={resetPhoto}
                        >
                            <ArrowBackIosIcon className='!size-5 mb-0.5' />
                            Reintentar
                        </Button>
                        <Button
                            variant="contained"
                            className="!capitalize !rounded-md flex gap-2"
                            size="large"
                            onClick={() => handleSubmit({ file: base64ToFile(photo) })}
                        >
                            Enviar
                            <SendRoundedIcon className='!size-5 mb-0.5' />
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-3 items-center">
                        <Button
                            className="!capitalize !rounded-md flex gap-1"
                            size="large"
                            variant='text'
                            color='inherit'
                            onClick={stopWebcamStream}
                        >
                            <ArrowBackIosIcon className='!size-5 mb-0.5' />
                            Cerrar cámara
                        </Button>
                        
                        {/* Botón para cambiar cámara */}
                        <IconButton
                            onClick={switchCamera}
                            className="!bg-gray-100 hover:!bg-gray-200 !transition-colors"
                            size="small"
                            title="Cambiar cámara"
                        >
                            <CameraswitchIcon className="!size-7 text-gray-700" />
                        </IconButton>
                        
                        <Button
                            variant="contained"
                            className="!capitalize !rounded-md flex gap-1"
                            size="large"
                            onClick={takePhoto}
                            disabled={!CanTakePhoto}
                        >
                            <LocalSeeIcon className='!size-5 mb-0.5' />
                            Tomar foto
                        </Button>
                    </div >
                )
                ) : (
                    <Button
                        variant="contained"
                        className="!capitalize !rounded-md"
                        size="large"
                        onClick={getWebcamStream}
                    >
                        Abrir cámara
                    </Button>
                )}

        </div >
    )
}

export default ActionButtons
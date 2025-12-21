import fondo_sjl_top from '../assets/backgrounds/fondo_sjl_top.png'
import fondo_sjl_bottom from '../assets/backgrounds/fondo_sjl_bottom.png'
import logo from '../assets/logo/logo.webp'
import Camera from '../Components/Verification/Camera'
import { useEffect, useRef, useState } from 'react';
import ActionButtons from '../Components/Verification/ActionButtons';
import { toast } from 'sonner';
import { useLogin } from '../hooks/auth/UseLogin';
import { useUsernamePasswordLogin } from '../hooks/auth/UseUsernamePasswordLogin';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/AuthSlice';
import UsernamePasswordForm from '../Components/Verification/UsernamePasswordForm';


const FaceVerification = () => {
    const dispatch = useDispatch();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [CanTakePhoto, setCanTakePhoto] = useState(false);
    const [Credentials, setCredentials] = useState({});
    const [facingMode, setFacingMode] = useState("environment"); // "environment" para trasera, "user" para frontal
    const [loginMethod] = useState("username"); // Siempre será "username" - Login por defecto con usuario y contraseña
    const [usernameCredentials, setUsernameCredentials] = useState({});

    const { refetch, data, error, isFetching } = useLogin(Credentials)
    const { refetch: refetchUsername, data: dataUsername, error: errorUsername, isFetching: isFetchingUsername } = useUsernamePasswordLogin(usernameCredentials)
    
    const getWebcamStream = async () => {
        setPhoto(null);
        setCanTakePhoto(false)
        if (!navigator.mediaDevices?.getUserMedia) {
            console.error("La cámara no está soportada en este dispositivo");
            return;
        }

        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
                audio: false,
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                checkVideoPlaying();
            }
        } catch (err) {
            toast.error(`${err}`)
            setCameraActive(false);
        }
    };

    const checkVideoPlaying = () => {
        if (videoRef?.current?.readyState >= 2) {
            setCanTakePhoto(true);
        } else {
            setTimeout(checkVideoPlaying, 100);
        }
    };

    const stopWebcamStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();

            tracks.forEach((track) => track.stop());

            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setCanTakePhoto(false);
        setPhoto(null);
    };


    const takePhoto = () => {

        if (!cameraActive) {
            toast.error("La camara no esta activa")
        }

        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            const scale = 0.7; // Redimensionar para reducir peso
            const width = videoRef.current.videoWidth * scale;
            const height = videoRef.current.videoHeight * scale;

            canvas.width = width;
            canvas.height = height;

            context.drawImage(videoRef.current, 0, 0, width, height);

            const imageUrl = canvas.toDataURL('image/jpeg', 0.7); // Comprimir imagen
            setPhoto(imageUrl);

            const stream = videoRef.current.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const resetPhoto = () => {
        setPhoto(null);
        getWebcamStream();
    };

    const switchCamera = async () => {
        // Detener el stream actual
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }

        // Cambiar entre cámara frontal y trasera
        const newFacingMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newFacingMode);

        // Reiniciar la cámara con el nuevo modo
        try {
            setCanTakePhoto(false);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode },
                audio: false,
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                checkVideoPlaying();
            }
        } catch (err) {
            toast.error(`Error al cambiar cámara: ${err.message}`);
            // Si falla, volver al modo anterior
            setFacingMode(facingMode);
            // Intentar con el modo anterior
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode },
                    audio: false,
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    checkVideoPlaying();
                }
            } catch (fallbackErr) {
                toast.error("Error al restaurar la cámara");
                setCameraActive(false);
            }
        }
    };


    const handleSubmit = async (values) => {
        setCredentials(values)
        queueMicrotask(refetch)
    }

    const handleUsernamePasswordSubmit = async (values) => {
        setUsernameCredentials(values)
        queueMicrotask(refetchUsername)
    }

    useEffect(() => {
        if (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Ocurrió un error al iniciar sesión'
            toast.error(message)
        }
    }, [error])

    useEffect(() => {
        if (errorUsername) {
            const message =
                errorUsername?.response?.data?.error ||
                errorUsername?.response?.data?.message ||
                errorUsername?.message ||
                'Ocurrió un error al iniciar sesión'
            toast.error(message)
        }
    }, [errorUsername])

    useEffect(() => {
        if (data) {
            // Guardar tanto el token como los datos del usuario
            dispatch(setUser({
                token: data.token,
                data: data.data
            }));
        }
    }, [data])

    useEffect(() => {
        if (dataUsername) {
            // Guardar tanto el token como los datos del usuario
            dispatch(setUser({
                token: dataUsername.token,
                data: dataUsername.data
            }));
        }
    }, [dataUsername])

    return (
        <div className="flex items-center justify-center bg-cover bg-center relative h-full">
            <div className="flex absolute top-0 left-0 w-2/4 sm:w-2/5 md:w-60 lg:w-80 aspect-square bg-left-top bg-no-repeat bg-cover drop-shadow"
                style={{ backgroundImage: `url(${fondo_sjl_top})` }}>
            </div>
            <div className="flex absolute bottom-0 right-0 w-2/4 sm:w-2/5 md:w-60 lg:w-80 aspect-square bg-right-bottombg-no-repeat bg-cover drop-shadow"
                style={{ backgroundImage: `url(${fondo_sjl_bottom})` }}>
            </div>

            <div className='flex flex-col items-center justify-center gap-6 w-full mb-20 min-h-[536px] px-4'>
                <img src={logo} alt="logo" className="h-20 w-auto z-10 drop-shadow" />

                {/* Título de bienvenida */}
                <h1 className="text-gray-900 text-2xl md:text-3xl font-bold text-center z-10 drop-shadow-lg">
                    Bienvenido
                </h1>

                {/* Descripción */}
                <p className="text-gray-800 text-base md:text-lg text-center z-10 drop-shadow max-w-md font-semibold">
                    Por favor, ingrese sus credenciales para continuar
                </p>

                {/* Contenido según el método seleccionado */}
                {loginMethod === "facial" ? (
                    <>
                        <Camera
                            cameraActive={cameraActive}
                            videoRef={videoRef}
                            photo={photo}
                            isLoading={isFetching}
                        />

                        <ActionButtons
                            cameraActive={cameraActive}
                            getWebcamStream={getWebcamStream}
                            stopWebcamStream={stopWebcamStream}
                            photo={photo}
                            CanTakePhoto={CanTakePhoto}
                            takePhoto={takePhoto}
                            resetPhoto={resetPhoto}
                            handleSubmit={handleSubmit}
                            switchCamera={switchCamera}
                        />
                    </>
                ) : (
                    <UsernamePasswordForm
                        onSubmit={handleUsernamePasswordSubmit}
                        isLoading={isFetchingUsername}
                    />
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    )
}

export default FaceVerification
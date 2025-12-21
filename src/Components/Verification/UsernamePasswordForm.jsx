import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const UsernamePasswordForm = ({ onSubmit, isLoading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Cargar usuario guardado al montar el componente
    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim() && password.trim()) {
            // Guardar o eliminar el usuario según la opción de recordar
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username.trim());
            } else {
                localStorage.removeItem('rememberedUsername');
            }
            onSubmit({ email: username.trim(), password });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md px-6 z-10">
            <div className="flex flex-col gap-5">
                {/* Campo de usuario */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="text-gray-900 font-bold text-lg drop-shadow-sm">
                        Correo
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ingrese su correo"
                        className="w-full px-5 py-4 text-lg rounded-lg bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-green-400 focus:border-green-400 transition-all shadow-lg"
                        required
                        disabled={isLoading}
                        autoComplete="username"
                    />
                </div>



                {/* Campo de contraseña */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-gray-900 font-bold text-lg drop-shadow-sm">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingrese su contraseña"
                            className="w-full px-5 py-4 pr-14 text-lg rounded-lg bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-green-400 focus:border-green-400 transition-all shadow-lg"
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors p-1"
                            disabled={isLoading}
                            tabIndex={-1}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-6 w-6" />
                            ) : (
                                <Eye className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Checkbox de recordar usuario */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-gray-400 text-green-600 focus:ring-4 focus:ring-green-400 cursor-pointer"
                        disabled={isLoading}
                    />
                    <label
                        htmlFor="rememberMe"
                        className="text-gray-900 font-semibold text-base drop-shadow-sm cursor-pointer select-none"
                    >
                        Recordar mi usuario
                    </label>
                </div>

                {/* Botón de submit */}
                <button
                    type="submit"
                    disabled={isLoading || !username.trim() || !password.trim()}
                    className="w-full mt-3 px-6 py-4 text-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-xl transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.97]"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Iniciando sesión...
                        </span>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </button>
            </div>
        </form>
    );
};

export default UsernamePasswordForm;

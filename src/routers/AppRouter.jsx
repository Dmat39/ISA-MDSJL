import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router';
import FaceVerification from '../Pages/FaceVerification';
import PublicRouter from './PublicRouter';
import PrivateRouter from './PrivateRouter';
import ListaIncidencias from '../Pages/incidencias/ListaIncidencias';
import RegistrarIncidencia from '../Pages/incidencias/Nueva Incidencia/RegistrarIncidencia';
import Layout from '../Pages/Layout';
import LayoutIncidencias from '../Pages/incidencias/LayoutIncidencias';
import NuevaIncidencia from '../Pages/incidencias/Registrar/NuevaIncidencia';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/verificacion" element={<PublicRouter element={<FaceVerification />} />} />
        <Route path="/" element={<PrivateRouter element={<Layout />} />}>
          <Route path="/" element={<LayoutIncidencias />} />
<<<<<<< HEAD
          <Route path="/nueva" element={<RegistrarIncidencia />} />
=======
          <Route path="/nueva" element={<NuevaIncidencia />} />
>>>>>>> 01b49df72fbda854b79e5338af384bb554a05fb9
          <Route path="/perfil" element={<ListaIncidencias />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default AppRouter
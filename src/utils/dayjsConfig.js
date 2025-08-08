import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Establece la zona horaria por defecto
const ZONA_HORARIA = 'America/Lima';

// Sobrescribe el método dayjs() para que siempre use GMT-5
const dayjsConZona = (...args) => {
  return dayjs(...args).tz(ZONA_HORARIA);
};

export { dayjsConZona, ZONA_HORARIA };

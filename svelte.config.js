//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'dist',
			assets: 'dist',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		prerender:{
			entries:[
				"/",
				"/animales",
				"/animales/1",
				"/inicio",
				"/inicio/cab",
				"/inicio/vet",
				"/login",
				"/nacimientos",
				"/rodeos",
				"/tactos/cab",
				"/tactos/cab/movimiento",
				
				"/user/config",
				"/inseminaciones",
				"/observaciones",
				"/tratamientos",
				"/importar",
				"/lotes",
				"/movimientos",
				"/user/new",
				"/recover",
				"/reportes",
				"/pesajes",
				"/establecimiento",
				"/pesajes/lista",
				"/pesajes/historial",
				"/colaboradores/asociar",
				"/colaboradores/1",
				"/establecimientos",
				"/establecimientos/nuevo",
				"/inseminaciones/movimiento",
				"/tratamientos/movimiento",
				
				"/user/nivel",
				"/servicios",
				"/servicios/movimiento",
				"/pendientes"


			]
		}
	}
};

export default config;

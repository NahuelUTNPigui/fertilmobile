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
				"/establecimiento",
				"/user/new",
				"/user/config"]
		}
	}
};

export default config;

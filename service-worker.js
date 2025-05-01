const cacheName = 'WhichNot/v1';
const cachables = {
	"/": "networkFirst",
	"//": "networkFirst",
	"/api/": null,
};

const getUrlFolder = (url) => url.split('://').slice(1).join('://').split('/')[1];

const checkUrlCaching = (url) => {
	let caching = (cachables[url] || cachables[`/${getUrlFolder(url)}/`]);
	if (caching === undefined) {
		caching = cachables['//'];
	};
	return caching;
};

const getFromCache = (request) => caches.open(cacheName).then((cache) => cache.match(request));

const putInCache = (request, response) => {
	if (request.method === 'GET' && response.ok) {
		return caches.open(cacheName).then((cache) => {
			try {
				return cache.put(request, response.clone());
			} catch(err) {}
		});
	}
};

const strategies = {
	networkFirst: async (event) => {
		try {
			if (await event.preloadResponse) {
				/*event.waitUntil*/await(putInCache(event.request, event.preloadResponse));
				return event.preloadResponse;
			}
			const networkResponse = await fetch(event.request, { cache: "reload" });
			/*event.waitUntil*/await(putInCache(event.request, networkResponse));
			return networkResponse;
		} catch (error) {
			return ((await getFromCache(event.request)) || Response.error());
		}
	},
};

self.addEventListener('install', (event) => {
	self.skipWaiting();
	event.waitUntil(
		caches.open(cacheName).then((cache) => cache.addAll([
			'/', '/index.html', '/manifest.json',
			'/app.js', '/icon.png',
			'/localforage.min.js', '/marked.min.js',
			'/preact/preact.js', '/preact/hooks.js', '/preact/htm.js',
		])),
	);
});

self.addEventListener('activate', (event) => event.waitUntil(async () => {
	if (self.registration.navigationPreload) {
		await self.registration.navigationPreload.enable();
	}
	await self.clients.claim();
}));

self.addEventListener('fetch', (event) => {
	const strategy = strategies[checkUrlCaching(event.request.url)];
	if (strategy) {
		return event.respondWith(strategy(event));
	}
});
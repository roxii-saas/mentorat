// Aree interne: niente Pixel, niente banner cookie, niente statistici di vizitare (admin, cont client, autentificare, download)
export const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/login', '/reset-password', '/update-password', '/descarca', '/api']
export const isPrivatePath = (path: string) => PRIVATE_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))

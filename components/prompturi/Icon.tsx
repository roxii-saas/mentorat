// Material Symbols (sottoinsieme caricato in app/prompturi/layout.tsx)
export function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return <span aria-hidden className={`material-symbols-outlined ${fill ? 'ms-fill' : ''} ${className}`}>{name}</span>
}

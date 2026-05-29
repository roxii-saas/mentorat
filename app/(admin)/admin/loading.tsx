export default function Loading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-pulse">
      <div className="h-8 w-56 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="admin-card rounded-2xl h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-card rounded-2xl h-56" />
        <div className="admin-card rounded-2xl h-56" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-white/5 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="admin-card rounded-2xl p-4 sm:p-5 h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-card rounded-2xl h-48" />
        <div className="admin-card rounded-2xl h-48" />
      </div>
    </div>
  )
}

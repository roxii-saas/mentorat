export default function Loading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-pulse">
      <div className="h-8 w-56 bg-[#E4E4EC] rounded-xl"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_,i) => <div key={i} className="g-card rounded-2xl h-[104px]"/>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="g-card rounded-2xl h-56"/><div className="g-card rounded-2xl h-56"/>
      </div>
    </div>
  )
}

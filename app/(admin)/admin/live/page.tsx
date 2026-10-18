import { requireAdmin } from '@/lib/auth'
import LiveDashboard from '@/components/admin/live/LiveDashboard'

export const dynamic = 'force-dynamic'

export default async function LivePage() {
  await requireAdmin()
  return <LiveDashboard />
}

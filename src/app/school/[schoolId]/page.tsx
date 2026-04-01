import { redirect } from 'next/navigation'

// /school/[schoolId] → /school/[schoolId]/dashboard
export default async function SchoolRootPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  redirect(`/school/${schoolId}/dashboard`)
}

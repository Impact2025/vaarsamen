import { redirect } from 'next/navigation'

// /berichten redirect naar /matches — zelfde data, één URL structuur
export default function BerichtenPage() {
  redirect('/matches')
}

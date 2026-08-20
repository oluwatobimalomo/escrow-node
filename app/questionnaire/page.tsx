import type { Metadata } from 'next'
import { QuestionnaireForm } from '@/components/questionnaire-form'

export const metadata: Metadata = {
  title: 'TrustLock — Research Questionnaire',
  description:
    'Post-task usability and trust-perception questionnaire for the TrustLock user study.',
}

// Deliberately outside app/dashboard — this page has no auth requirement,
// since study participants may never create a TrustLock account.
export default function QuestionnairePage() {
  return <QuestionnaireForm />
}

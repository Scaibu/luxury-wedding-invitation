import { SmoothScrollProvider } from '@/components/smooth-scroll-provider'
import { MusicProvider } from '@/components/music-provider'
import { InvitationExperience } from '@/components/invitation-experience'

export default function App() {
  return (
    <SmoothScrollProvider>
      <MusicProvider>
        <InvitationExperience />
      </MusicProvider>
    </SmoothScrollProvider>
  )
}

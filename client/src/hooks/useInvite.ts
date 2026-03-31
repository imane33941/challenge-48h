import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

interface Invitation {
  from: string
  roomCode: string
  game: 'duel' | 'express'
}

export function useInvite(pseudo: string, onAccepted: (roomCode: string) => void) {
  const channelRef = useRef<any>(null)
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [inviteSent, setInviteSent] = useState(false)

  useEffect(() => {
    if (!pseudo || !supabase) return

    const channel = supabase.channel(`invite-${pseudo}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'invitation' }, ({ payload }: any) => {
        setInvitation(payload)
      })
      .on('broadcast', { event: 'accepted' }, ({ payload }: any) => {
        setInviteSent(false)
        onAccepted(payload.roomCode)
      })
      .on('broadcast', { event: 'declined' }, () => {
        setInviteSent(false)
        setInvitation(null)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pseudo])

  async function sendInvite(toPseudo: string, roomCode: string, game: 'duel' | 'express') {
    if (!supabase) return

    const channel = supabase.channel(`invite-${toPseudo}`, {
      config: { broadcast: { self: false } },
    })
    await channel.subscribe()
    await channel.send({
      type: 'broadcast',
      event: 'invitation',
      payload: { from: pseudo, roomCode, game },
    })
    setInviteSent(true)
    setTimeout(() => supabase.removeChannel(channel), 2000)
  }

  async function acceptInvite() {
    if (!supabase) return
    if (!invitation) return

    const channel = supabase.channel(`invite-${invitation.from}`, {
      config: { broadcast: { self: false } },
    })
    await channel.subscribe()
    await channel.send({
      type: 'broadcast',
      event: 'accepted',
      payload: { roomCode: invitation.roomCode },
    })
    setTimeout(() => supabase.removeChannel(channel), 2000)
    onAccepted(invitation.roomCode)
    setInvitation(null)
  }

  async function declineInvite() {
    if (!supabase) return
    if (!invitation) return

    const channel = supabase.channel(`invite-${invitation.from}`, {
      config: { broadcast: { self: false } },
    })
    await channel.subscribe()
    await channel.send({
      type: 'broadcast',
      event: 'declined',
      payload: {},
    })
    setTimeout(() => supabase.removeChannel(channel), 2000)
    setInvitation(null)
  }

  return { invitation, inviteSent, sendInvite, acceptInvite, declineInvite }
}
